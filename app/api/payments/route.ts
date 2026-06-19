import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invoiceId, amount, paymentMethod, note } = body

    if (!invoiceId || !amount) {
      return NextResponse.json({ error: 'invoiceId and amount required' }, { status: 400 })
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const payAmount = Number(amount)
    if (payAmount <= 0) return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    if (payAmount > Number(invoice.dueAmount)) {
      return NextResponse.json({ error: 'Amount exceeds due amount' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount:        payAmount,
          paymentMethod: paymentMethod || 'CASH',
          note:          note || null,
          paymentDate:   body.paymentDate ? new Date(body.paymentDate) : new Date(),
        },
      })

      // Update invoice totals
      const newPaid = Number(invoice.paidAmount) + payAmount
      const newDue  = Number(invoice.finalAmount) - newPaid
      const status  = newDue <= 0 ? 'PAID' : 'PARTIAL'

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaid,
          dueAmount:  Math.max(0, newDue),
          status,
        },
        include: { payments: true },
      })

      return { payment, invoice: updatedInvoice }
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get('invoiceId')
    const page      = Number(searchParams.get('page') || 1)
    const limit     = Number(searchParams.get('limit') || 20)

    const where: any = {}
    if (invoiceId) where.invoiceId = invoiceId

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            include: {
              enrollment: {
                include: {
                  student: { select: { fullName: true, studentCode: true } },
                  course:  { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({ data: payments, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

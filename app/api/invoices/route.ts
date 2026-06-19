import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page   = Number(searchParams.get('page') || 1)
    const limit  = Number(searchParams.get('limit') || 20)

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { enrollment: { student: { fullName: { contains: search, mode: 'insensitive' } } } },
        { enrollment: { student: { studentCode: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    const [invoices, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: {
          enrollment: {
            include: {
              student: { select: { fullName: true, studentCode: true, phone: true } },
              course:  { select: { name: true } },
              class:   { select: { className: true } },
            },
          },
          payments: { orderBy: { paymentDate: 'asc' } },
        },
        orderBy: { invoiceDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({ data: invoices, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

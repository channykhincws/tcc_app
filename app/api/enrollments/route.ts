import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInvoiceNo } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search    = searchParams.get('search') || ''
    const status    = searchParams.get('status') || ''
    const classId   = searchParams.get('classId') || ''
    const page      = Number(searchParams.get('page') || 1)
    const limit     = Number(searchParams.get('limit') || 20)

    const where: any = {}
    if (status) where.status = status
    if (classId) where.classId = classId
    if (search) {
      where.student = {
        OR: [
          { fullName:    { contains: search, mode: 'insensitive' } },
          { studentCode: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [enrollments, total] = await prisma.$transaction([
      prisma.enrollment.findMany({
        where,
        include: {
          student:  { select: { fullName: true, studentCode: true, phone: true } },
          course:   { select: { name: true, code: true } },
          class:    { select: { className: true, classCode: true } },
          invoice:  { select: { status: true, paidAmount: true, dueAmount: true, finalAmount: true } },
          progress: true,
        },
        orderBy: { enrollDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ])

    return NextResponse.json({ data: enrollments, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Check class capacity
    const cls = await prisma.class.findUnique({
      where: { id: body.classId },
      include: { _count: { select: { enrollments: true } } },
    })
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    if (cls._count.enrollments >= cls.maxStudent) {
      return NextResponse.json({ error: 'Class is full' }, { status: 400 })
    }

    // Check duplicate enrollment
    const existing = await prisma.enrollment.findFirst({
      where: { studentId: body.studentId, classId: body.classId, status: 'ACTIVE' },
    })
    if (existing) return NextResponse.json({ error: 'Student already enrolled in this class' }, { status: 409 })

    const discount  = Number(body.discount || 0)
    const totalFee  = Number(body.totalFee)
    const finalFee  = totalFee - discount

    // Transaction: enrollment + invoice + progress
    const result = await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          studentId:   body.studentId,
          courseId:    body.courseId,
          classId:     body.classId,
          startDate:   new Date(body.startDate),
          endDate:     new Date(body.endDate),
          totalFee,
          discount,
          finalFee,
          paymentType: body.paymentType || 'INSTALLMENT',
          status:      'ACTIVE',
        },
      })

      const count     = await tx.invoice.count()
      const invoiceNo = generateInvoiceNo(count)

      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          enrollmentId: enrollment.id,
          totalFee,
          discount,
          finalAmount:  finalFee,
          paidAmount:   0,
          dueAmount:    finalFee,
          status:       'UNPAID',
        },
      })

      // Calculate total study days
      const start    = new Date(body.startDate)
      const end      = new Date(body.endDate)
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const remaining = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

      await tx.enrollmentProgress.create({
        data: {
          enrollmentId: enrollment.id,
          totalDays,
          attendedDays: 0,
          remainingDays: remaining,
        },
      })

      return { enrollment, invoice }
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
  }
}

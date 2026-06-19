import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCode } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page   = Number(searchParams.get('page') || 1)
    const limit  = Number(searchParams.get('limit') || 20)
    const status = searchParams.get('status') // 'active' | 'inactive' | ''

    const where: any = {}
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { studentCode: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }
    if (status === 'active')   where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        include: {
          enrollments: {
            include: {
              course: { select: { name: true } },
              class:  { select: { className: true } },
              invoice: { select: { status: true, dueAmount: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.student.count({ where }),
    ])

    return NextResponse.json({
      data: students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Generate student code
    const count = await prisma.student.count()
    const studentCode = body.studentCode || generateCode('STU', count)

    const student = await prisma.student.create({
      data: {
        studentCode,
        fullName:     body.fullName,
        gender:       body.gender,
        dob:          body.dob ? new Date(body.dob) : null,
        phone:        body.phone || null,
        parentPhone:  body.parentPhone || null,
        address:      body.address || null,
        photo:        body.photo || null,
        registerDate: body.registerDate ? new Date(body.registerDate) : new Date(),
      },
    })

    // Audit log
    const userId = req.headers.get('x-user-id')
    if (userId) {
      await prisma.auditLog.create({
        data: { userId, action: 'CREATE', table: 'students', recordId: student.id, newValue: student as any },
      })
    }

    return NextResponse.json({ data: student }, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Student code already exists' }, { status: 409 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
  }
}

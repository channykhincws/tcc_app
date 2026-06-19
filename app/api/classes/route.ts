import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search   = searchParams.get('search') || ''
    const courseId = searchParams.get('courseId') || ''
    const page     = Number(searchParams.get('page') || 1)
    const limit    = Number(searchParams.get('limit') || 20)

    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { className: { contains: search, mode: 'insensitive' } },
        { classCode: { contains: search, mode: 'insensitive' } },
        { room: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (courseId) where.courseId = courseId

    const [classes, total] = await prisma.$transaction([
      prisma.class.findMany({
        where,
        include: {
          course:  { select: { name: true, code: true, fee: true } },
          teacher: { select: { fullName: true, teacherCode: true } },
          shift:   { select: { name: true } },
          _count:  { select: { enrollments: true } },
        },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.class.count({ where }),
    ])

    return NextResponse.json({ data: classes, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const cls = await prisma.class.create({
      data: {
        classCode:  body.classCode,
        className:  body.className,
        courseId:   body.courseId,
        teacherId:  body.teacherId || null,
        shiftId:    body.shiftId || null,
        room:       body.room || null,
        startDate:  new Date(body.startDate),
        endDate:    new Date(body.endDate),
        maxStudent: Number(body.maxStudent) || 30,
      },
    })

    return NextResponse.json({ data: cls }, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Class code already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
  }
}

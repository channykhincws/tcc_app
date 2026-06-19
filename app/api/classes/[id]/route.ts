import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        course:  true,
        teacher: true,
        shift:   true,
        enrollments: {
          include: {
            student: { select: { fullName: true, studentCode: true, phone: true } },
            invoice: { select: { status: true, dueAmount: true, paidAmount: true } },
          },
        },
        _count: { select: { enrollments: true, attendance: true } },
      },
    })
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    return NextResponse.json({ data: cls })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const cls  = await prisma.class.update({
      where: { id: params.id },
      data: {
        classCode:  body.classCode,
        className:  body.className,
        courseId:   body.courseId,
        teacherId:  body.teacherId  || null,
        shiftId:    body.shiftId    || null,
        room:       body.room       || null,
        startDate:  new Date(body.startDate),
        endDate:    new Date(body.endDate),
        maxStudent: Number(body.maxStudent),
        isActive:   body.isActive ?? true,
      },
    })
    return NextResponse.json({ data: cls })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Class code already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.class.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ message: 'Class deactivated' })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

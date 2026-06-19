import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          include: {
            course: true,
            class: { include: { shift: true, teacher: true } },
            invoice: { include: { payments: true } },
            progress: true,
          },
          orderBy: { enrollDate: 'desc' },
        },
        attendance: {
          orderBy: { attendanceDate: 'desc' },
          take: 30,
          include: { class: { select: { className: true } } },
        },
      },
    })

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    return NextResponse.json({ data: student })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        fullName:    body.fullName,
        gender:      body.gender,
        dob:         body.dob ? new Date(body.dob) : null,
        phone:       body.phone || null,
        parentPhone: body.parentPhone || null,
        address:     body.address || null,
        photo:       body.photo || null,
        isActive:    body.isActive ?? true,
      },
    })

    const userId = req.headers.get('x-user-id')
    if (userId) {
      await prisma.auditLog.create({
        data: { userId, action: 'UPDATE', table: 'students', recordId: student.id, newValue: student as any },
      })
    }

    return NextResponse.json({ data: student })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Soft delete
    const student = await prisma.student.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    const userId = req.headers.get('x-user-id')
    if (userId) {
      await prisma.auditLog.create({
        data: { userId, action: 'DELETE', table: 'students', recordId: params.id },
      })
    }

    return NextResponse.json({ message: 'Student deactivated' })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}

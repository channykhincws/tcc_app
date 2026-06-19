import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        classes: { include: { course: true, shift: true } },
        user: { select: { email: true, role: true } },
      },
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    return NextResponse.json({ data: teacher })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body    = await req.json()
    const teacher = await prisma.teacher.update({
      where: { id: params.id },
      data: {
        fullName:       body.fullName,
        gender:         body.gender,
        phone:          body.phone || null,
        email:          body.email || null,
        address:        body.address || null,
        specialization: body.specialization || null,
        salary:         body.salary ? Number(body.salary) : null,
        isActive:       body.isActive ?? true,
      },
    })
    return NextResponse.json({ data: teacher })
  } catch { return NextResponse.json({ error: 'Failed to update' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.teacher.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ message: 'Teacher deactivated' })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

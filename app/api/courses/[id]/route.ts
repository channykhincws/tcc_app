import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        classes: { include: { teacher: true, shift: true, _count: { select: { enrollments: true } } } },
        _count: { select: { enrollments: true, classes: true } },
      },
    })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    return NextResponse.json({ data: course })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body   = await req.json()
    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        code:          body.code,
        name:          body.name,
        description:   body.description || null,
        durationMonth: Number(body.durationMonth),
        fee:           Number(body.fee),
        status:        Boolean(body.status),
      },
    })
    return NextResponse.json({ data: course })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Course code already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.course.update({ where: { id: params.id }, data: { status: false } })
    return NextResponse.json({ message: 'Course deactivated' })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

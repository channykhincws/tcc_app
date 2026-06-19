import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status === 'active')   where.status = true
    if (status === 'inactive') where.status = false

    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: { select: { enrollments: true, classes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: courses })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const course = await prisma.course.create({
      data: {
        code:          body.code,
        name:          body.name,
        description:   body.description || null,
        durationMonth: Number(body.durationMonth),
        fee:           Number(body.fee),
        status:        body.status ?? true,
      },
    })

    return NextResponse.json({ data: course }, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Course code already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}

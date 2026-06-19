import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCode } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page   = Number(searchParams.get('page') || 1)
    const limit  = Number(searchParams.get('limit') || 20)

    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { teacherCode: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [teachers, total] = await prisma.$transaction([
      prisma.teacher.findMany({
        where,
        include: {
          classes: {
            where: { isActive: true },
            include: { course: { select: { name: true } }, shift: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.teacher.count({ where }),
    ])

    return NextResponse.json({ data: teachers, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const count = await prisma.teacher.count()
    const teacherCode = body.teacherCode || generateCode('TCH', count)

    const teacher = await prisma.teacher.create({
      data: {
        teacherCode,
        fullName:       body.fullName,
        gender:         body.gender,
        phone:          body.phone || null,
        email:          body.email || null,
        address:        body.address || null,
        specialization: body.specialization || null,
        salary:         body.salary ? Number(body.salary) : null,
      },
    })

    return NextResponse.json({ data: teacher }, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Teacher code already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 })
  }
}

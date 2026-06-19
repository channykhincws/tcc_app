import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId') || ''
    const date    = searchParams.get('date') || ''
    const page    = Number(searchParams.get('page') || 1)
    const limit   = Number(searchParams.get('limit') || 50)

    const where: any = {}
    if (classId) where.classId = classId
    if (date) where.attendanceDate = new Date(date)

    const [attendance, total] = await prisma.$transaction([
      prisma.attendance.findMany({
        where,
        include: {
          student: { select: { fullName: true, studentCode: true, photo: true } },
          class:   { select: { className: true } },
        },
        orderBy: [{ attendanceDate: 'desc' }, { student: { fullName: 'asc' } }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ])

    return NextResponse.json({ data: attendance, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Bulk upsert attendance for a class on a date
    if (Array.isArray(body.records)) {
      const results = await prisma.$transaction(
        body.records.map((r: any) =>
          prisma.attendance.upsert({
            where: {
              classId_studentId_attendanceDate: {
                classId:        r.classId,
                studentId:      r.studentId,
                attendanceDate: new Date(r.attendanceDate),
              },
            },
            update: { status: r.status, note: r.note || null },
            create: {
              classId:        r.classId,
              studentId:      r.studentId,
              attendanceDate: new Date(r.attendanceDate),
              status:         r.status,
              note:           r.note || null,
            },
          })
        )
      )

      // Update progress for each student
      for (const r of body.records) {
        const enrollment = await prisma.enrollment.findFirst({
          where: { studentId: r.studentId, classId: r.classId, status: 'ACTIVE' },
          include: { progress: true },
        })
        if (enrollment?.progress) {
          const attended = await prisma.attendance.count({
            where: { studentId: r.studentId, classId: r.classId, status: 'PRESENT' },
          })
          const remaining = Math.max(0, Math.ceil(
            (new Date(enrollment.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ))
          await prisma.enrollmentProgress.update({
            where: { enrollmentId: enrollment.id },
            data: { attendedDays: attended, remainingDays: remaining },
          })
        }
      }

      return NextResponse.json({ data: results, count: results.length })
    }

    // Single record
    const record = await prisma.attendance.upsert({
      where: {
        classId_studentId_attendanceDate: {
          classId:        body.classId,
          studentId:      body.studentId,
          attendanceDate: new Date(body.attendanceDate),
        },
      },
      update: { status: body.status, note: body.note || null },
      create: {
        classId:        body.classId,
        studentId:      body.studentId,
        attendanceDate: new Date(body.attendanceDate),
        status:         body.status,
        note:           body.note || null,
      },
    })

    return NextResponse.json({ data: record })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
  }
}

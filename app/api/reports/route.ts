import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exportStudents, exportFinancialReport, exportAttendance, exportOutstandingPayments } from '@/lib/export/excel'
import { exportStudentsPDF, exportFinancialPDF, exportAttendancePDF } from '@/lib/export/pdf'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type      = searchParams.get('type')    // financial | students | attendance | outstanding
  const format    = searchParams.get('format')  // excel | pdf | json
  const startDate = searchParams.get('startDate')
  const endDate   = searchParams.get('endDate')
  const classId   = searchParams.get('classId')

  try {
    // ── Financial Report ───────────────────────────────────
    if (type === 'financial') {
      const where: any = {}
      if (startDate) where.invoiceDate = { gte: new Date(startDate) }
      if (endDate)   where.invoiceDate = { ...where.invoiceDate, lte: new Date(endDate) }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          enrollment: {
            include: {
              student: { select: { fullName: true, studentCode: true } },
              course:  { select: { name: true } },
              class:   { select: { className: true } },
            },
          },
          payments: true,
        },
        orderBy: { invoiceDate: 'desc' },
      })

      const period = startDate && endDate
        ? `${startDate} to ${endDate}`
        : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

      if (format === 'excel') {
        const buffer = await exportFinancialReport(invoices, period)
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="financial-report-${Date.now()}.xlsx"`,
          },
        })
      }
      if (format === 'pdf') {
        const bytes = exportFinancialPDF(invoices, period)
        return new NextResponse(Buffer.from(bytes), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="financial-report-${Date.now()}.pdf"`,
          },
        })
      }

      // Summary for JSON
      const totalRevenue  = invoices.reduce((s, i) => s + Number(i.paidAmount), 0)
      const totalDue      = invoices.reduce((s, i) => s + Number(i.dueAmount), 0)
      return NextResponse.json({ data: invoices, summary: { totalRevenue, totalDue } })
    }

    // ── Students Report ────────────────────────────────────
    if (type === 'students') {
      const where: any = {}
      if (startDate) where.registerDate = { gte: new Date(startDate) }
      if (endDate)   where.registerDate = { ...where.registerDate, lte: new Date(endDate) }

      const students = await prisma.student.findMany({
        where,
        include: { enrollments: { include: { course: { select: { name: true } } } } },
        orderBy: { registerDate: 'desc' },
      })

      if (format === 'excel') {
        const buffer = await exportStudents(students)
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="students-${Date.now()}.xlsx"`,
          },
        })
      }
      if (format === 'pdf') {
        const bytes = exportStudentsPDF(students)
        return new NextResponse(Buffer.from(bytes), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="students-${Date.now()}.pdf"`,
          },
        })
      }

      return NextResponse.json({ data: students })
    }

    // ── Attendance Report ──────────────────────────────────
    if (type === 'attendance') {
      const where: any = {}
      if (classId)   where.classId = classId
      if (startDate) where.attendanceDate = { gte: new Date(startDate) }
      if (endDate)   where.attendanceDate = { ...where.attendanceDate, lte: new Date(endDate) }

      const records = await prisma.attendance.findMany({
        where,
        include: {
          student: { select: { fullName: true, studentCode: true } },
          class:   { select: { className: true } },
        },
        orderBy: [{ attendanceDate: 'desc' }, { student: { fullName: 'asc' } }],
      })

      const cls = classId
        ? await prisma.class.findUnique({ where: { id: classId }, select: { className: true } })
        : null
      const className = cls?.className || 'All Classes'

      if (format === 'excel') {
        const buffer = await exportAttendance(records, className)
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="attendance-${Date.now()}.xlsx"`,
          },
        })
      }
      if (format === 'pdf') {
        const bytes = exportAttendancePDF(records, className)
        return new NextResponse(Buffer.from(bytes), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="attendance-${Date.now()}.pdf"`,
          },
        })
      }

      return NextResponse.json({ data: records })
    }

    // ── Outstanding Payments ───────────────────────────────
    if (type === 'outstanding') {
      const invoices = await prisma.invoice.findMany({
        where: { status: { in: ['UNPAID', 'PARTIAL'] } },
        include: {
          enrollment: {
            include: {
              student: { select: { fullName: true, studentCode: true, phone: true } },
              course:  { select: { name: true } },
              class:   { select: { className: true } },
            },
          },
        },
        orderBy: { dueAmount: 'desc' },
      })

      if (format === 'excel') {
        const buffer = await exportOutstandingPayments(invoices)
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="outstanding-payments-${Date.now()}.xlsx"`,
          },
        })
      }

      const total = invoices.reduce((s, i) => s + Number(i.dueAmount), 0)
      return NextResponse.json({ data: invoices, summary: { totalDue: total, count: invoices.length } })
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
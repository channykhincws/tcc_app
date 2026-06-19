import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const now       = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      totalCourses,
      monthlyPayments,
      unpaidInvoices,
      partialInvoices,
      todayClasses,
      newStudentsToday,
      newStudentsMonth,
      classesFull,
      courseEndingSoon,
    ] = await prisma.$transaction([
      prisma.student.count(),
      prisma.student.count({ where: { isActive: true } }),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.course.count({ where: { status: true } }),

      // Monthly revenue
      prisma.payment.aggregate({
        where: { paymentDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),

      // Unpaid invoices
      prisma.invoice.aggregate({
        where: { status: 'UNPAID' },
        _sum: { dueAmount: true },
        _count: true,
      }),

      // Partial invoices
      prisma.invoice.aggregate({
        where: { status: 'PARTIAL' },
        _sum: { dueAmount: true },
        _count: true,
      }),

      // Today's active classes
      prisma.class.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate:   { gte: now },
        },
        include: {
          course:  { select: { name: true } },
          teacher: { select: { fullName: true } },
          shift:   { select: { name: true } },
          _count:  { select: { enrollments: true } },
        },
        take: 10,
      }),

      // New students today
      prisma.student.count({
        where: { registerDate: { gte: new Date(now.setHours(0,0,0,0)) } },
      }),

      // New students this month
      prisma.student.count({
        where: { registerDate: { gte: startOfMonth, lte: endOfMonth } },
      }),

      // Classes at capacity
      prisma.class.findMany({
        where: { isActive: true },
        include: { _count: { select: { enrollments: true } } },
      }),

      // Enrollments ending within 7 days
      prisma.enrollment.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          student: { select: { fullName: true, phone: true } },
          course:  { select: { name: true } },
          class:   { select: { className: true } },
          progress: true,
        },
        take: 20,
      }),
    ])

    const unpaidTotal  = Number(unpaidInvoices._sum.dueAmount || 0)
    const partialTotal = Number(partialInvoices._sum.dueAmount || 0)
    const totalUnpaid  = unpaidTotal + partialTotal

    // Build alerts
    const alerts: any[] = []

    // Due payment alerts
    const dueInvoices = await prisma.invoice.findMany({
      where: { status: { in: ['UNPAID', 'PARTIAL'] } },
      include: {
        enrollment: {
          include: {
            student: { select: { fullName: true, phone: true } },
            course:  { select: { name: true } },
          },
        },
      },
      take: 10,
      orderBy: { dueAmount: 'desc' },
    })
    dueInvoices.forEach(inv => {
      alerts.push({
        type: 'DUE_PAYMENT',
        message: `${inv.enrollment.student.fullName} owes $${Number(inv.dueAmount).toFixed(2)}`,
        studentName: inv.enrollment.student.fullName,
        amount: Number(inv.dueAmount),
      })
    })

    // Course ending soon alerts
    courseEndingSoon.forEach(enr => {
      const days = enr.progress?.remainingDays ?? 0
      alerts.push({
        type: 'COURSE_ENDING',
        message: `${enr.student.fullName} — ${enr.course.name} ends in ${days} day(s)`,
        studentName: enr.student.fullName,
        className: enr.class.className,
        daysLeft: days,
      })
    })

    // Class full alerts
    classesFull.forEach(cls => {
      if (cls._count.enrollments >= cls.maxStudent) {
        alerts.push({
          type: 'CLASS_FULL',
          message: `Class is full (${cls._count.enrollments}/${cls.maxStudent})`,
          className: `${cls.classCode}`,
        })
      }
    })

    // Monthly chart data (last 6 months)
    const chartData = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const mEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const revenue = await prisma.payment.aggregate({
        where: { paymentDate: { gte: mStart, lte: mEnd } },
        _sum: { amount: true },
      })
      chartData.push({
        month: mStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: Number(revenue._sum.amount || 0),
      })
    }

    return NextResponse.json({
      stats: {
        totalStudents,
        activeStudents,
        totalTeachers,
        totalCourses,
        monthlyRevenue: Number(monthlyPayments._sum.amount || 0),
        unpaidAmount: totalUnpaid,
        todayClassCount: todayClasses.length,
        newStudentsToday,
        newStudentsMonth,
      },
      todayClasses,
      alerts: alerts.slice(0, 20),
      chartData,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}

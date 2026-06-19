import { PrismaClient, Role, InvoiceStatus, EnrollmentStatus, AttendanceStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Users ────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123', 10)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@school.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@school.com',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@school.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  await prisma.user.upsert({
    where: { email: 'accountant@school.com' },
    update: {},
    create: {
      name: 'Sok Chenda',
      email: 'accountant@school.com',
      password: hashedPassword,
      role: Role.ACCOUNTANT,
    },
  })

  // ─── Shifts ───────────────────────────────────────────────
  const morning = await prisma.shift.upsert({
    where: { id: 'shift-morning' },
    update: {},
    create: { id: 'shift-morning', name: 'Morning' },
  })
  const afternoon = await prisma.shift.upsert({
    where: { id: 'shift-afternoon' },
    update: {},
    create: { id: 'shift-afternoon', name: 'Afternoon' },
  })
  const evening = await prisma.shift.upsert({
    where: { id: 'shift-evening' },
    update: {},
    create: { id: 'shift-evening', name: 'Evening' },
  })

  // ─── Study Times ──────────────────────────────────────────
  await prisma.studyTime.createMany({
    skipDuplicates: true,
    data: [
      { id: 'st-1', startTime: '07:00', endTime: '08:30' },
      { id: 'st-2', startTime: '08:30', endTime: '10:00' },
      { id: 'st-3', startTime: '10:00', endTime: '11:30' },
      { id: 'st-4', startTime: '13:30', endTime: '15:00' },
      { id: 'st-5', startTime: '15:00', endTime: '16:30' },
      { id: 'st-6', startTime: '17:30', endTime: '19:00' },
      { id: 'st-7', startTime: '19:00', endTime: '20:30' },
    ],
  })

  // ─── Teachers ─────────────────────────────────────────────
  const teacher1 = await prisma.teacher.upsert({
    where: { teacherCode: 'TCH001' },
    update: {},
    create: {
      teacherCode: 'TCH001',
      fullName: 'Chan Dara',
      gender: 'Male',
      phone: '012345678',
      email: 'chandara@school.com',
      specialization: 'English',
      salary: 400,
    },
  })
  const teacher2 = await prisma.teacher.upsert({
    where: { teacherCode: 'TCH002' },
    update: {},
    create: {
      teacherCode: 'TCH002',
      fullName: 'Sok Pisey',
      gender: 'Female',
      phone: '092345678',
      email: 'sokpisey@school.com',
      specialization: 'Computer',
      salary: 350,
    },
  })
  const teacher3 = await prisma.teacher.upsert({
    where: { teacherCode: 'TCH003' },
    update: {},
    create: {
      teacherCode: 'TCH003',
      fullName: 'Ly Meng',
      gender: 'Male',
      phone: '077345678',
      specialization: 'Chinese',
      salary: 500,
    },
  })

  // Link teacher users
  await prisma.user.upsert({
    where: { email: 'chandara@school.com' },
    update: {},
    create: {
      name: 'Chan Dara',
      email: 'chandara@school.com',
      password: hashedPassword,
      role: Role.TEACHER,
      teacherId: teacher1.id,
    },
  })

  // ─── Courses ──────────────────────────────────────────────
  const eng1 = await prisma.course.upsert({
    where: { code: 'ENG-01' },
    update: {},
    create: {
      code: 'ENG-01',
      name: 'English Level 1',
      description: 'Beginner English course for all ages',
      durationMonth: 3,
      fee: 120,
      status: true,
    },
  })
  const eng2 = await prisma.course.upsert({
    where: { code: 'ENG-02' },
    update: {},
    create: {
      code: 'ENG-02',
      name: 'English Level 2',
      description: 'Intermediate English speaking and writing',
      durationMonth: 3,
      fee: 140,
      status: true,
    },
  })
  const comp = await prisma.course.upsert({
    where: { code: 'COMP-01' },
    update: {},
    create: {
      code: 'COMP-01',
      name: 'Computer Basic',
      description: 'MS Office, Internet, basic computing skills',
      durationMonth: 2,
      fee: 80,
      status: true,
    },
  })
  const chinese = await prisma.course.upsert({
    where: { code: 'CN-HSK1' },
    update: {},
    create: {
      code: 'CN-HSK1',
      name: 'Chinese HSK 1',
      description: 'Mandarin Chinese for beginners - HSK Level 1',
      durationMonth: 4,
      fee: 200,
      status: true,
    },
  })
  await prisma.course.upsert({
    where: { code: 'DESIGN-01' },
    update: {},
    create: {
      code: 'DESIGN-01',
      name: 'Graphic Design',
      description: 'Photoshop, Illustrator, and design principles',
      durationMonth: 3,
      fee: 150,
      status: true,
    },
  })

  // ─── Classes ──────────────────────────────────────────────
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate3m = new Date(now.getFullYear(), now.getMonth() + 3, 0)
  const endDate2m = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  const endDate4m = new Date(now.getFullYear(), now.getMonth() + 4, 0)

  const class1 = await prisma.class.upsert({
    where: { classCode: 'ENG01-M-A' },
    update: {},
    create: {
      classCode: 'ENG01-M-A',
      className: 'English L1 - Morning A',
      courseId: eng1.id,
      teacherId: teacher1.id,
      shiftId: morning.id,
      room: 'Room 101',
      startDate,
      endDate: endDate3m,
      maxStudent: 20,
    },
  })
  const class2 = await prisma.class.upsert({
    where: { classCode: 'ENG01-E-B' },
    update: {},
    create: {
      classCode: 'ENG01-E-B',
      className: 'English L1 - Evening B',
      courseId: eng1.id,
      teacherId: teacher1.id,
      shiftId: evening.id,
      room: 'Room 102',
      startDate,
      endDate: endDate3m,
      maxStudent: 25,
    },
  })
  const class3 = await prisma.class.upsert({
    where: { classCode: 'COMP01-A-A' },
    update: {},
    create: {
      classCode: 'COMP01-A-A',
      className: 'Computer Basic - Afternoon',
      courseId: comp.id,
      teacherId: teacher2.id,
      shiftId: afternoon.id,
      room: 'Computer Lab',
      startDate,
      endDate: endDate2m,
      maxStudent: 15,
    },
  })
  const class4 = await prisma.class.upsert({
    where: { classCode: 'CN-HSK1-E-A' },
    update: {},
    create: {
      classCode: 'CN-HSK1-E-A',
      className: 'Chinese HSK1 - Evening A',
      courseId: chinese.id,
      teacherId: teacher3.id,
      shiftId: evening.id,
      room: 'Room 201',
      startDate,
      endDate: endDate4m,
      maxStudent: 20,
    },
  })
  const class5 = await prisma.class.upsert({
    where: { classCode: 'ENG02-M-A' },
    update: {},
    create: {
      classCode: 'ENG02-M-A',
      className: 'English L2 - Morning A',
      courseId: eng2.id,
      teacherId: teacher1.id,
      shiftId: morning.id,
      room: 'Room 103',
      startDate,
      endDate: endDate3m,
      maxStudent: 20,
    },
  })

  // ─── Students ─────────────────────────────────────────────
  const studentsData = [
    { code: 'STU001', fullName: 'Pich Sreymom', gender: 'Female', phone: '012111001', parentPhone: '012000001' },
    { code: 'STU002', fullName: 'Kosal Dara', gender: 'Male', phone: '012111002', parentPhone: '012000002' },
    { code: 'STU003', fullName: 'Chanthy Lina', gender: 'Female', phone: '012111003', parentPhone: '012000003' },
    { code: 'STU004', fullName: 'Rith Sokha', gender: 'Male', phone: '012111004', parentPhone: '012000004' },
    { code: 'STU005', fullName: 'Mealea Phally', gender: 'Female', phone: '012111005', parentPhone: '012000005' },
    { code: 'STU006', fullName: 'Visal Bora', gender: 'Male', phone: '012111006', parentPhone: '012000006' },
    { code: 'STU007', fullName: 'Sreyleak Devi', gender: 'Female', phone: '012111007', parentPhone: '012000007' },
    { code: 'STU008', fullName: 'Menghour Ratha', gender: 'Male', phone: '012111008', parentPhone: '012000008' },
    { code: 'STU009', fullName: 'Sophy Chan', gender: 'Female', phone: '012111009', parentPhone: '012000009' },
    { code: 'STU010', fullName: 'Bunna Keo', gender: 'Male', phone: '012111010', parentPhone: '012000010' },
    { code: 'STU011', fullName: 'Dara Thy', gender: 'Male', phone: '012111011', parentPhone: '012000011' },
    { code: 'STU012', fullName: 'Kannitha Ros', gender: 'Female', phone: '012111012', parentPhone: '012000012' },
  ]

  const students = []
  for (const s of studentsData) {
    const student = await prisma.student.upsert({
      where: { studentCode: s.code },
      update: {},
      create: {
        studentCode: s.code,
        fullName: s.fullName,
        gender: s.gender,
        phone: s.phone,
        parentPhone: s.parentPhone,
        dob: new Date(2005, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: 'Phnom Penh',
        registerDate: new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 3), Math.floor(Math.random() * 20) + 1),
      },
    })
    students.push(student)
  }

  // ─── Enrollments + Invoices ───────────────────────────────
  const enrollmentData = [
    { studentIdx: 0, classRef: class1, course: eng1, fee: 120, paid: 120, status: InvoiceStatus.PAID },
    { studentIdx: 1, classRef: class1, course: eng1, fee: 120, paid: 60, status: InvoiceStatus.PARTIAL },
    { studentIdx: 2, classRef: class1, course: eng1, fee: 120, paid: 0, status: InvoiceStatus.UNPAID },
    { studentIdx: 3, classRef: class2, course: eng1, fee: 120, paid: 120, status: InvoiceStatus.PAID },
    { studentIdx: 4, classRef: class2, course: eng1, fee: 120, paid: 80, status: InvoiceStatus.PARTIAL },
    { studentIdx: 5, classRef: class3, course: comp, fee: 80, paid: 80, status: InvoiceStatus.PAID },
    { studentIdx: 6, classRef: class3, course: comp, fee: 80, paid: 0, status: InvoiceStatus.UNPAID },
    { studentIdx: 7, classRef: class4, course: chinese, fee: 200, paid: 100, status: InvoiceStatus.PARTIAL },
    { studentIdx: 8, classRef: class4, course: chinese, fee: 200, paid: 200, status: InvoiceStatus.PAID },
    { studentIdx: 9, classRef: class5, course: eng2, fee: 140, paid: 140, status: InvoiceStatus.PAID },
    { studentIdx: 10, classRef: class5, course: eng2, fee: 140, paid: 70, status: InvoiceStatus.PARTIAL },
    { studentIdx: 11, classRef: class3, course: comp, fee: 80, paid: 80, status: InvoiceStatus.PAID },
  ]

  for (let i = 0; i < enrollmentData.length; i++) {
    const ed = enrollmentData[i]
    const student = students[ed.studentIdx]
    const invoiceNo = `INV-${String(2025001 + i).padStart(7, '0')}`

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, classId: ed.classRef.id },
    })
    if (existingEnrollment) continue

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: ed.course.id,
        classId: ed.classRef.id,
        startDate: ed.classRef.startDate,
        endDate: ed.classRef.endDate,
        totalFee: ed.fee,
        discount: 0,
        finalFee: ed.fee,
        paymentType: 'INSTALLMENT',
        status: EnrollmentStatus.ACTIVE,
      },
    })

    const due = ed.fee - ed.paid
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        enrollmentId: enrollment.id,
        totalFee: ed.fee,
        discount: 0,
        finalAmount: ed.fee,
        paidAmount: ed.paid,
        dueAmount: due,
        status: ed.status,
      },
    })

    // Create payments
    if (ed.paid > 0) {
      if (ed.paid === ed.fee) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: ed.paid,
            paymentMethod: 'CASH',
            note: 'Full payment',
          },
        })
      } else {
        const half = ed.paid / 2
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: half,
            paymentDate: new Date(now.getFullYear(), now.getMonth(), 1),
            paymentMethod: 'CASH',
            note: 'First installment',
          },
        })
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: half,
            paymentDate: new Date(now.getFullYear(), now.getMonth(), 15),
            paymentMethod: 'QR',
            note: 'Second installment',
          },
        })
      }
    }

    // Enrollment progress
    const totalDays = 90
    const attended = Math.floor(Math.random() * 30) + 10
    const remaining = Math.max(0, Math.ceil((ed.classRef.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    await prisma.enrollmentProgress.create({
      data: {
        enrollmentId: enrollment.id,
        totalDays,
        attendedDays: attended,
        remainingDays: remaining,
      },
    })
  }

  // ─── Attendance (last 7 days for class1) ─────────────────
  const enrolledInClass1 = await prisma.enrollment.findMany({
    where: { classId: class1.id },
    select: { studentId: true },
  })

  for (let d = 6; d >= 0; d--) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    if (date.getDay() === 0 || date.getDay() === 6) continue // skip weekends

    for (const enr of enrolledInClass1) {
      const rand = Math.random()
      const status = rand < 0.8 ? AttendanceStatus.PRESENT : rand < 0.9 ? AttendanceStatus.LATE : AttendanceStatus.ABSENT
      await prisma.attendance.upsert({
        where: {
          classId_studentId_attendanceDate: {
            classId: class1.id,
            studentId: enr.studentId,
            attendanceDate: date,
          },
        },
        update: {},
        create: {
          classId: class1.id,
          studentId: enr.studentId,
          attendanceDate: date,
          status,
        },
      })
    }
  }

  // ─── Settings ─────────────────────────────────────────────
  const settings = [
    { key: 'school_name', value: 'ABC Training Center' },
    { key: 'school_address', value: 'Phnom Penh, Cambodia' },
    { key: 'school_phone', value: '023 000 000' },
    { key: 'school_email', value: 'info@abctraining.com' },
    { key: 'currency', value: 'USD' },
    { key: 'invoice_prefix', value: 'INV' },
  ]
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  console.log('✅ Seed complete!')
  console.log('─────────────────────────────────────')
  console.log('🔑 Login accounts:')
  console.log('   superadmin@school.com / Admin@123')
  console.log('   admin@school.com       / Admin@123')
  console.log('   accountant@school.com  / Admin@123')
  console.log('   chandara@school.com    / Admin@123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

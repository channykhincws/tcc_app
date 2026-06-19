// ─── Enums ───────────────────────────────────────────────────────
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'TEACHER'
export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID'
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'

// ─── Auth ─────────────────────────────────────────────────────────
export interface JWTPayload {
  id: string
  email: string
  name: string
  role: Role
  teacherId?: string
}

// ─── Entities ─────────────────────────────────────────────────────
export interface Teacher {
  id: string
  teacherCode: string
  fullName: string
  gender: string
  phone?: string
  email?: string
  address?: string
  specialization?: string
  salary?: number
  isActive: boolean
  createdAt: string
}

export interface Course {
  id: string
  code: string
  name: string
  description?: string
  durationMonth: number
  fee: number
  status: boolean
  createdAt: string
  _count?: { enrollments: number; classes: number }
}

export interface Shift {
  id: string
  name: string
}

export interface Class {
  id: string
  classCode: string
  className: string
  courseId: string
  course?: Course
  teacherId?: string
  teacher?: Teacher
  shiftId?: string
  shift?: Shift
  room?: string
  startDate: string
  endDate: string
  maxStudent: number
  isActive: boolean
  _count?: { enrollments: number }
}

export interface Student {
  id: string
  studentCode: string
  fullName: string
  gender: string
  dob?: string
  phone?: string
  parentPhone?: string
  address?: string
  registerDate: string
  photo?: string
  isActive: boolean
  createdAt: string
  enrollments?: Enrollment[]
}

export interface Enrollment {
  id: string
  studentId: string
  student?: Student
  courseId: string
  course?: Course
  classId: string
  class?: Class
  enrollDate: string
  startDate: string
  endDate: string
  totalFee: number
  discount: number
  finalFee: number
  paymentType: string
  status: EnrollmentStatus
  invoice?: Invoice
  progress?: EnrollmentProgress
}

export interface Invoice {
  id: string
  invoiceNo: string
  enrollmentId: string
  enrollment?: Enrollment
  invoiceDate: string
  totalFee: number
  discount: number
  finalAmount: number
  paidAmount: number
  dueAmount: number
  status: InvoiceStatus
  payments?: Payment[]
}

export interface Payment {
  id: string
  invoiceId: string
  paymentDate: string
  amount: number
  paymentMethod: string
  note?: string
}

export interface Attendance {
  id: string
  classId: string
  class?: Class
  studentId: string
  student?: Student
  attendanceDate: string
  status: AttendanceStatus
  note?: string
}

export interface EnrollmentProgress {
  enrollmentId: string
  totalDays: number
  attendedDays: number
  remainingDays: number
}

// ─── Dashboard ────────────────────────────────────────────────────
export interface DashboardStats {
  totalStudents: number
  activeStudents: number
  totalTeachers: number
  totalCourses: number
  monthlyRevenue: number
  unpaidAmount: number
  todayClasses: number
}

export interface Alert {
  type: 'DUE_PAYMENT' | 'COURSE_ENDING' | 'CLASS_FULL'
  message: string
  studentName?: string
  className?: string
  daysLeft?: number
  amount?: number
}

// ─── API Response ─────────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── Reports ──────────────────────────────────────────────────────
export interface ReportFilter {
  startDate?: string
  endDate?: string
  courseId?: string
  classId?: string
  status?: string
}

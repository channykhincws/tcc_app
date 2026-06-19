import ExcelJS from 'exceljs'
import { formatDate, formatCurrency } from '@/lib/utils'

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4F46E5' }, // indigo-600
}
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
}

function styleHeader(ws: ExcelJS.Worksheet, colCount: number) {
  const row = ws.getRow(1)
  row.height = 28
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF6366F1' } },
    }
  }
}

function addTitle(ws: ExcelJS.Worksheet, title: string, colCount: number) {
  ws.insertRow(1, [title])
  ws.mergeCells(1, 1, 1, colCount)
  const titleRow = ws.getRow(1)
  titleRow.height = 32
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1E1B4B' } }
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
}

// ─── Students ────────────────────────────────────────────────────
export async function exportStudents(students: any[]): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'School Management System'
  wb.created = new Date()

  const ws = wb.addWorksheet('Students', { views: [{ state: 'frozen', ySplit: 2 }] })

  ws.columns = [
    { key: 'no', width: 6 },
    { key: 'studentCode', width: 12 },
    { key: 'fullName', width: 24 },
    { key: 'gender', width: 10 },
    { key: 'dob', width: 14 },
    { key: 'phone', width: 14 },
    { key: 'parentPhone', width: 16 },
    { key: 'address', width: 24 },
    { key: 'registerDate', width: 14 },
    { key: 'status', width: 10 },
  ]

  ws.addRow(['#', 'Student Code', 'Full Name', 'Gender', 'Date of Birth', 'Phone', 'Parent Phone', 'Address', 'Register Date', 'Status'])
  styleHeader(ws, 10)

  students.forEach((s, i) => {
    const row = ws.addRow([
      i + 1,
      s.studentCode,
      s.fullName,
      s.gender,
      s.dob ? formatDate(s.dob) : '',
      s.phone || '',
      s.parentPhone || '',
      s.address || '',
      formatDate(s.registerDate),
      s.isActive ? 'Active' : 'Inactive',
    ])
    if (i % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FF' } }
    }
  })

  addTitle(ws, 'Student List Report', 10)

  return wb.xlsx.writeBuffer()
}

// ─── Financial Report ─────────────────────────────────────────────
export async function exportFinancialReport(invoices: any[], period: string): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Financial Report', { views: [{ state: 'frozen', ySplit: 2 }] })

  ws.columns = [
    { key: 'no', width: 6 },
    { key: 'invoiceNo', width: 16 },
    { key: 'student', width: 24 },
    { key: 'course', width: 20 },
    { key: 'invoiceDate', width: 14 },
    { key: 'totalFee', width: 12 },
    { key: 'paidAmount', width: 12 },
    { key: 'dueAmount', width: 12 },
    { key: 'status', width: 10 },
  ]

  ws.addRow(['#', 'Invoice No', 'Student', 'Course', 'Invoice Date', 'Total Fee', 'Paid', 'Due', 'Status'])
  styleHeader(ws, 9)

  let totalFee = 0, totalPaid = 0, totalDue = 0

  invoices.forEach((inv, i) => {
    totalFee += Number(inv.finalAmount)
    totalPaid += Number(inv.paidAmount)
    totalDue += Number(inv.dueAmount)

    const row = ws.addRow([
      i + 1,
      inv.invoiceNo,
      inv.enrollment?.student?.fullName || '',
      inv.enrollment?.course?.name || '',
      formatDate(inv.invoiceDate),
      Number(inv.finalAmount),
      Number(inv.paidAmount),
      Number(inv.dueAmount),
      inv.status,
    ])
    // Format currency columns
    ;['F', 'G', 'H'].forEach(col => {
      row.getCell(col).numFmt = '"$"#,##0.00'
    })
    // Color status
    const statusCell = row.getCell('I')
    statusCell.font = {
      color: {
        argb: inv.status === 'PAID' ? 'FF166534' : inv.status === 'PARTIAL' ? 'FF854D0E' : 'FF991B1B'
      }
    }
    if (i % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FF' } }
    }
  })

  // Summary row
  ws.addRow([])
  const sumRow = ws.addRow(['', '', '', '', 'Total', totalFee, totalPaid, totalDue, ''])
  sumRow.font = { bold: true }
  ;['F', 'G', 'H'].forEach(col => {
    sumRow.getCell(col).numFmt = '"$"#,##0.00'
  })
  sumRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }

  addTitle(ws, `Financial Report — ${period}`, 9)

 return wb.xlsx.writeBuffer()
}

// ─── Attendance Report ────────────────────────────────────────────
export async function exportAttendance(records: any[], className: string): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Attendance')

  ws.columns = [
    { key: 'no', width: 6 },
    { key: 'studentCode', width: 12 },
    { key: 'fullName', width: 24 },
    { key: 'date', width: 14 },
    { key: 'status', width: 12 },
    { key: 'note', width: 24 },
  ]

  ws.addRow(['#', 'Student Code', 'Full Name', 'Date', 'Status', 'Note'])
  styleHeader(ws, 6)

  records.forEach((r, i) => {
    const row = ws.addRow([
      i + 1,
      r.student?.studentCode || '',
      r.student?.fullName || '',
      formatDate(r.attendanceDate),
      r.status,
      r.note || '',
    ])
    const statusCell = row.getCell('E')
    const colors: Record<string, string> = { PRESENT: 'FF166534', LATE: 'FF854D0E', ABSENT: 'FF991B1B' }
    statusCell.font = { color: { argb: colors[r.status] || 'FF333333' } }
  })

  addTitle(ws, `Attendance — ${className}`, 6)

  return wb.xlsx.writeBuffer()
}

// ─── Outstanding Payments ─────────────────────────────────────────
export async function exportOutstandingPayments(invoices: any[]): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Outstanding Payments')

  ws.columns = [
    { key: 'no', width: 6 },
    { key: 'student', width: 24 },
    { key: 'phone', width: 14 },
    { key: 'course', width: 20 },
    { key: 'totalFee', width: 12 },
    { key: 'paidAmount', width: 12 },
    { key: 'dueAmount', width: 12 },
    { key: 'status', width: 10 },
  ]

  ws.addRow(['#', 'Student', 'Phone', 'Course', 'Total Fee', 'Paid', 'Due Amount', 'Status'])
  styleHeader(ws, 8)

  invoices.forEach((inv, i) => {
    const row = ws.addRow([
      i + 1,
      inv.enrollment?.student?.fullName || '',
      inv.enrollment?.student?.phone || '',
      inv.enrollment?.course?.name || '',
      Number(inv.finalAmount),
      Number(inv.paidAmount),
      Number(inv.dueAmount),
      inv.status,
    ])
    ;['E', 'F', 'G'].forEach(col => {
      row.getCell(col).numFmt = '"$"#,##0.00'
    })
    row.getCell('H').font = { color: { argb: inv.status === 'PARTIAL' ? 'FF854D0E' : 'FF991B1B' } }
  })

  addTitle(ws, 'Outstanding Payments Report', 8)

return wb.xlsx.writeBuffer()
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, MapPin, Calendar, BookOpen, DollarSign, Clock } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading]  = useState(true)
  const [tab, setTab]          = useState<'enrollments' | 'attendance' | 'payments'>('enrollments')

  useEffect(() => {
    fetch(`/api/students/${params.id}`)
      .then(r => r.json())
      .then(d => { setStudent(d.data); setLoading(false) })
  }, [params.id])

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>
  if (!student) return <div className="text-center py-20 text-slate-400">Student not found</div>

  const activeEnrollments    = student.enrollments?.filter((e: any) => e.status === 'ACTIVE') || []
  const completedEnrollments = student.enrollments?.filter((e: any) => e.status !== 'ACTIVE') || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => router.back()} className="btn-ghost gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-3xl font-bold flex-shrink-0">
            {student.fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{student.fullName}</h1>
              <StatusBadge status={student.isActive ? 'ACTIVE' : 'DROPPED'} />
            </div>
            <p className="text-sm text-slate-500 font-mono">{student.studentCode}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <InfoItem icon={User} label="Gender" value={student.gender} />
              <InfoItem icon={Calendar} label="Date of Birth" value={student.dob ? formatDate(student.dob) : '—'} />
              <InfoItem icon={Phone} label="Phone" value={student.phone || '—'} />
              <InfoItem icon={Phone} label="Parent Phone" value={student.parentPhone || '—'} />
              <InfoItem icon={MapPin} label="Address" value={student.address || '—'} />
              <InfoItem icon={Calendar} label="Registered" value={formatDate(student.registerDate)} />
              <InfoItem icon={BookOpen} label="Enrollments" value={`${student.enrollments?.length || 0} courses`} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{activeEnrollments.length}</p>
          <p className="text-sm text-slate-500">Active Courses</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(student.enrollments?.reduce((s: number, e: any) => s + Number(e.invoice?.paidAmount || 0), 0) || 0)}
          </p>
          <p className="text-sm text-slate-500">Total Paid</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(student.enrollments?.reduce((s: number, e: any) => s + Number(e.invoice?.dueAmount || 0), 0) || 0)}
          </p>
          <p className="text-sm text-slate-500">Outstanding</p>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-slate-200">
          {(['enrollments', 'attendance', 'payments'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px
                ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Enrollments Tab */}
        {tab === 'enrollments' && (
          <div className="space-y-3 mt-4">
            {student.enrollments?.length === 0 && (
              <div className="card p-8 text-center text-slate-400">No enrollments</div>
            )}
            {student.enrollments?.map((enr: any) => (
              <div key={enr.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{enr.course?.name}</h3>
                      <StatusBadge status={enr.status} />
                    </div>
                    <p className="text-sm text-slate-500">{enr.class?.className}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(enr.startDate)} — {formatDate(enr.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(Number(enr.finalFee))}</p>
                    {enr.invoice && <StatusBadge status={enr.invoice.status} />}
                  </div>
                </div>

                {/* Progress */}
                {enr.progress && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>Progress: {enr.progress.attendedDays}/{enr.progress.totalDays} days</span>
                      <span className="text-amber-600">{enr.progress.remainingDays} days remaining</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (enr.progress.attendedDays / Math.max(1, enr.progress.totalDays)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Payment info */}
                {enr.invoice && (
                  <div className="mt-3 flex gap-4 text-xs">
                    <span className="text-emerald-600">Paid: {formatCurrency(Number(enr.invoice.paidAmount))}</span>
                    {Number(enr.invoice.dueAmount) > 0 && (
                      <span className="text-red-600">Due: {formatCurrency(Number(enr.invoice.dueAmount))}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Attendance Tab */}
        {tab === 'attendance' && (
          <div className="card mt-4 overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {student.attendance?.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-400">No attendance records</td></tr>
                )}
                {student.attendance?.map((a: any) => (
                  <tr key={a.id}>
                    <td className="text-slate-600 text-xs">{formatDate(a.attendanceDate)}</td>
                    <td className="text-slate-600">{a.class?.className}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="text-slate-400 text-xs">{a.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payments Tab */}
        {tab === 'payments' && (
          <div className="space-y-3 mt-4">
            {student.enrollments?.filter((e: any) => e.invoice?.payments?.length > 0).map((enr: any) => (
              <div key={enr.id} className="card overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                  <p className="font-medium text-slate-900">{enr.course?.name} — {enr.invoice?.invoiceNo}</p>
                  <p className="text-xs text-slate-500">Total: {formatCurrency(Number(enr.invoice?.finalAmount))} | Due: {formatCurrency(Number(enr.invoice?.dueAmount))}</p>
                </div>
                <table className="table">
                  <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Note</th></tr></thead>
                  <tbody>
                    {enr.invoice?.payments?.map((p: any) => (
                      <tr key={p.id}>
                        <td className="text-xs text-slate-500">{formatDate(p.paymentDate)}</td>
                        <td className="font-medium text-emerald-700">{formatCurrency(Number(p.amount))}</td>
                        <td><span className="badge badge-blue">{p.paymentMethod}</span></td>
                        <td className="text-slate-400 text-xs">{p.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses]   = useState<any[]>([])
  const [classes, setClasses]   = useState<any[]>([])
  const [form, setForm] = useState({
    studentId: '', courseId: '', classId: '',
    discount: '0', paymentType: 'INSTALLMENT',
    startDate: '', endDate: '',
  })
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const res  = await fetch(`/api/enrollments?${params}`)
    const data = await res.json()
    setEnrollments(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  // Load students/courses for form
  useEffect(() => {
    if (!showForm) return
    Promise.all([
      fetch('/api/students?limit=200&status=active').then(r => r.json()),
      fetch('/api/courses?status=active').then(r => r.json()),
    ]).then(([s, c]) => {
      setStudents(s.data || [])
      setCourses(c.data || [])
    })
  }, [showForm])

  // Load classes when course is selected
  useEffect(() => {
    if (!form.courseId) { setClasses([]); return }
    fetch(`/api/classes?courseId=${form.courseId}&limit=50`)
      .then(r => r.json())
      .then(d => setClasses(d.data || []))
    const course = courses.find(c => c.id === form.courseId)
    setSelectedCourse(course)
    setForm(f => ({ ...f, classId: '' }))
  }, [form.courseId, courses])

  // Auto-fill dates when class selected
  useEffect(() => {
    if (!form.classId) return
    const cls = classes.find(c => c.id === form.classId)
    if (cls) {
      setForm(f => ({
        ...f,
        startDate: cls.startDate?.slice(0, 10) || '',
        endDate:   cls.endDate?.slice(0, 10) || '',
      }))
    }
  }, [form.classId, classes])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    const totalFee = Number(selectedCourse?.fee || 0)
    const discount = Number(form.discount || 0)

    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, totalFee, discount }),
    })
    const data = await res.json()

    if (!res.ok) {
      setFormError(data.error || 'Failed to enroll')
      setSaving(false)
      return
    }

    setShowForm(false)
    setForm({ studentId: '', courseId: '', classId: '', discount: '0', paymentType: 'INSTALLMENT', startDate: '', endDate: '' })
    load()
    setSaving(false)
  }

  const finalFee = Number(selectedCourse?.fee || 0) - Number(form.discount || 0)

  const columns = [
    {
      key: 'student', header: 'Student',
      render: (e: any) => (
        <div>
          <p className="font-medium text-slate-900">{e.student?.fullName}</p>
          <p className="text-xs text-slate-400 font-mono">{e.student?.studentCode}</p>
        </div>
      ),
    },
    {
      key: 'course', header: 'Course',
      render: (e: any) => (
        <div>
          <p className="text-slate-700">{e.course?.name}</p>
          <p className="text-xs text-slate-400">{e.class?.className}</p>
        </div>
      ),
    },
    {
      key: 'period', header: 'Period',
      render: (e: any) => (
        <div className="text-xs text-slate-500">
          <p>{formatDate(e.startDate)}</p>
          <p>→ {formatDate(e.endDate)}</p>
        </div>
      ),
    },
    {
      key: 'fee', header: 'Fee',
      render: (e: any) => (
        <div>
          <p className="font-medium">{formatCurrency(Number(e.finalFee))}</p>
          {Number(e.discount) > 0 && <p className="text-xs text-emerald-600">-{formatCurrency(Number(e.discount))}</p>}
        </div>
      ),
    },
    {
      key: 'payment', header: 'Payment',
      render: (e: any) => e.invoice ? (
        <div>
          <StatusBadge status={e.invoice.status} />
          {Number(e.invoice?.dueAmount) > 0 && (
            <p className="text-xs text-red-500 mt-0.5">Due: {formatCurrency(Number(e.invoice.dueAmount))}</p>
          )}
        </div>
      ) : null,
    },
    {
      key: 'progress', header: 'Progress',
      render: (e: any) => e.progress ? (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span>{e.progress.attendedDays}/{e.progress.totalDays} days</span>
            <span className="text-amber-600">({e.progress.remainingDays} left)</span>
          </div>
          <div className="h-1.5 w-24 bg-slate-100 rounded-full">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${Math.min(100, (e.progress.attendedDays / Math.max(1, e.progress.totalDays)) * 100)}%` }}
            />
          </div>
        </div>
      ) : null,
    },
    {
      key: 'status', header: 'Status',
      render: (e: any) => <StatusBadge status={e.status} />,
    },
    {
      key: 'date', header: 'Enrolled',
      render: (e: any) => <span className="text-xs text-slate-400">{formatDate(e.enrollDate)}</span>,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Enrollments</h1>
          <p className="page-subtitle">{total} total enrollments</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Enrollment
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {[
          { val: '', label: 'All' },
          { val: 'ACTIVE', label: 'Active' },
          { val: 'COMPLETED', label: 'Completed' },
          { val: 'DROPPED', label: 'Dropped' },
        ].map(f => (
          <button
            key={f.val}
            onClick={() => { setStatus(f.val); setPage(1) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${status === f.val ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        data={enrollments}
        columns={columns}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        onSearch={q => { setSearch(q); setPage(1) }}
        searchPlaceholder="Search by student name or code..."
        loading={loading}
        rowKey={e => e.id}
        emptyMessage="No enrollments found"
      />

      {/* Enrollment Form Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setFormError('') }}
        title="New Enrollment"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>
          )}

          <div>
            <label className="label">Student *</label>
            <select
              className="input"
              value={form.studentId}
              onChange={e => setForm({ ...form, studentId: e.target.value })}
              required
            >
              <option value="">— Select student —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Course *</label>
            <select
              className="input"
              value={form.courseId}
              onChange={e => setForm({ ...form, courseId: e.target.value })}
              required
            >
              <option value="">— Select course —</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {formatCurrency(Number(c.fee))}</option>
              ))}
            </select>
          </div>

          {form.courseId && (
            <div>
              <label className="label">Class *</label>
              <select
                className="input"
                value={form.classId}
                onChange={e => setForm({ ...form, classId: e.target.value })}
                required
              >
                <option value="">— Select class —</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.className} ({c.shift?.name}) — {c._count?.enrollments}/{c.maxStudent} students
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date" className="input"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date" className="input"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Discount ($)</label>
              <input
                type="number" step="0.01" min="0" className="input"
                value={form.discount}
                onChange={e => setForm({ ...form, discount: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Payment Type</label>
              <select
                className="input"
                value={form.paymentType}
                onChange={e => setForm({ ...form, paymentType: e.target.value })}
              >
                <option value="FULL">Full Payment</option>
                <option value="INSTALLMENT">Installment</option>
              </select>
            </div>
          </div>

          {/* Fee summary */}
          {selectedCourse && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Course Fee</span>
                <span className="font-medium">{formatCurrency(Number(selectedCourse.fee))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <span className="text-emerald-600">- {formatCurrency(Number(form.discount || 0))}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-indigo-200 pt-1.5 mt-1.5">
                <span className="text-indigo-900">Total to Pay</span>
                <span className="text-indigo-700 text-base">{formatCurrency(finalFee)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enroll Student
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

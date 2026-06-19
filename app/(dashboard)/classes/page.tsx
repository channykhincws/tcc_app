'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2, Users, School } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { formatDate } from '@/lib/utils'

export default function ClassesPage() {
  const [classes, setClasses]   = useState<any[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<any>(null)

  // Form data
  const [courses, setCourses]   = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [shifts, setShifts]     = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    const res  = await fetch(`/api/classes?${params}`)
    const data = await res.json()
    setClasses(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!showForm) return
    Promise.all([
      fetch('/api/courses?status=active').then(r => r.json()),
      fetch('/api/teachers?limit=100').then(r => r.json()),
      fetch('/api/shifts').then(r => r.json()),
    ]).then(([c, t, s]) => {
      setCourses(c.data || [])
      setTeachers(t.data || [])
      setShifts(s.data || [])
    })
  }, [showForm])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deactivate class "${name}"?`)) return
    await fetch(`/api/classes/${id}`, { method: 'DELETE' })
    load()
  }

  const columns = [
    {
      key: 'classCode', header: 'Code',
      render: (c: any) => <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{c.classCode}</span>,
    },
    {
      key: 'className', header: 'Class',
      render: (c: any) => (
        <div>
          <p className="font-medium text-slate-900">{c.className}</p>
          <p className="text-xs text-slate-400">{c.room || 'No room'}</p>
        </div>
      ),
    },
    {
      key: 'course', header: 'Course',
      render: (c: any) => <span className="text-slate-700">{c.course?.name}</span>,
    },
    {
      key: 'teacher', header: 'Teacher',
      render: (c: any) => <span className="text-slate-600">{c.teacher?.fullName || '—'}</span>,
    },
    {
      key: 'shift', header: 'Shift',
      render: (c: any) => c.shift ? <span className="badge badge-blue">{c.shift.name}</span> : <span className="text-slate-400">—</span>,
    },
    {
      key: 'period', header: 'Period',
      render: (c: any) => (
        <div className="text-xs text-slate-500">
          <p>{formatDate(c.startDate)}</p>
          <p>→ {formatDate(c.endDate)}</p>
        </div>
      ),
    },
    {
      key: 'students', header: 'Students',
      render: (c: any) => {
        const count = c._count?.enrollments || 0
        const pct   = Math.min(100, (count / c.maxStudent) * 100)
        const full  = count >= c.maxStudent
        return (
          <div className="min-w-20">
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className={`text-xs font-medium ${full ? 'text-red-600' : 'text-slate-600'}`}>
                {count}/{c.maxStudent}
              </span>
              {full && <span className="badge badge-red text-xs">Full</span>}
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full w-20">
              <div className={`h-full rounded-full ${full ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      },
    },
    {
      key: 'status', header: 'Status',
      render: (c: any) => <StatusBadge status={c.isActive ? 'ACTIVE' : 'DROPPED'} />,
    },
    {
      key: 'actions', header: '',
      render: (c: any) => (
        <div className="flex gap-1">
          <button onClick={e => { e.stopPropagation(); setEditing(c); setShowForm(true) }} className="btn-icon text-amber-600">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={e => { e.stopPropagation(); handleDelete(c.id, c.className) }} className="btn-icon text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">{total} classes active</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      <DataTable
        data={classes}
        columns={columns}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        onSearch={q => { setSearch(q); setPage(1) }}
        searchPlaceholder="Search by class name, code, room..."
        loading={loading}
        rowKey={c => c.id}
        emptyMessage="No classes found"
      />

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Class' : 'Add New Class'}
        size="lg"
      >
        <ClassForm
          initial={editing}
          courses={courses}
          teachers={teachers}
          shifts={shifts}
          onSuccess={() => { setShowForm(false); setEditing(null); load() }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>
    </div>
  )
}

// ─── Class Form ───────────────────────────────────────────────────
function ClassForm({ initial, courses, teachers, shifts, onSuccess, onCancel }: {
  initial?: any; courses: any[]; teachers: any[]; shifts: any[]
  onSuccess: () => void; onCancel: () => void
}) {
  const [form, setForm] = useState({
    classCode:  initial?.classCode  || '',
    className:  initial?.className  || '',
    courseId:   initial?.courseId   || '',
    teacherId:  initial?.teacherId  || '',
    shiftId:    initial?.shiftId    || '',
    room:       initial?.room       || '',
    startDate:  initial?.startDate  ? initial.startDate.slice(0, 10) : '',
    endDate:    initial?.endDate    ? initial.endDate.slice(0, 10)   : '',
    maxStudent: initial?.maxStudent || '30',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Auto-calculate end date when course + startDate change
  useEffect(() => {
    if (!form.courseId || !form.startDate) return
    const course = courses.find(c => c.id === form.courseId)
    if (course && form.startDate) {
      const start = new Date(form.startDate)
      start.setMonth(start.getMonth() + Number(course.durationMonth))
      setForm(f => ({ ...f, endDate: start.toISOString().slice(0, 10) }))
    }
  }, [form.courseId, form.startDate, courses])

  const f = (field: string) => ({
    value: (form as any)[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [field]: e.target.value }),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const method = initial ? 'PUT' : 'POST'
    const url    = initial ? `/api/classes/${initial.id}` : '/api/classes'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to save'); setLoading(false); return }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Class Code *</label>
          <input className="input" placeholder="ENG01-M-A" required {...f('classCode')} />
        </div>
        <div>
          <label className="label">Class Name *</label>
          <input className="input" placeholder="English L1 - Morning A" required {...f('className')} />
        </div>
        <div className="col-span-2">
          <label className="label">Course *</label>
          <select className="input" required {...f('courseId')}>
            <option value="">— Select course —</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.durationMonth}m)</option>)}
          </select>
        </div>
        <div>
          <label className="label">Teacher</label>
          <select className="input" {...f('teacherId')}>
            <option value="">— No teacher —</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Shift</label>
          <select className="input" {...f('shiftId')}>
            <option value="">— No shift —</option>
            {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Room</label>
          <input className="input" placeholder="Room 101" {...f('room')} />
        </div>
        <div>
          <label className="label">Max Students</label>
          <input type="number" min="1" max="200" className="input" {...f('maxStudent')} />
        </div>
        <div>
          <label className="label">Start Date *</label>
          <input type="date" className="input" required {...f('startDate')} />
        </div>
        <div>
          <label className="label">End Date *</label>
          <input type="date" className="input" required {...f('endDate')} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Save Changes' : 'Add Class'}
        </button>
      </div>
    </form>
  )
}

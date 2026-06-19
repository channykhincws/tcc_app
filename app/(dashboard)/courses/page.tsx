'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, BookOpen, Loader2, Users, School } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency } from '@/lib/utils'

export default function CoursesPage() {
  const [courses, setCourses]   = useState<any[]>([])
  const [loading, setLoading]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<any>(null)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filter) params.set('status', filter)
    const res  = await fetch(`/api/courses?${params}`)
    const data = await res.json()
    setCourses(data.data || [])
    setLoading(false)
  }, [search, filter])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deactivate course "${name}"?`)) return
    await fetch(`/api/courses/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">{courses.length} courses available</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-72">
          <input
            className="input pl-4"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[{ val: '', label: 'All' }, { val: 'active', label: 'Active' }, { val: 'inactive', label: 'Inactive' }].map(f => (
            <button
              key={f.val}
              onClick={() => setFilter(f.val)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filter === f.val ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <div key={course.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={course.status ? 'ACTIVE' : 'DROPPED'} />
                  <button
                    onClick={() => { setEditing(course); setShowForm(true) }}
                    className="btn-icon"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id, course.name)}
                    className="btn-icon text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-1">
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{course.code}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mt-2">{course.name}</h3>
              {course.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-indigo-600">{formatCurrency(Number(course.fee))}</p>
                  <p className="text-xs text-slate-400">Fee</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{course.durationMonth}m</p>
                  <p className="text-xs text-slate-400">Duration</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-lg font-bold text-slate-900">{course._count?.enrollments || 0}</p>
                  </div>
                  <p className="text-xs text-slate-400">Students</p>
                </div>
              </div>

              {course._count?.classes > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <School className="w-3.5 h-3.5" />
                  <span>{course._count.classes} class(es)</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Course' : 'Add New Course'}
        size="md"
      >
        <CourseForm
          initial={editing}
          onSuccess={() => { setShowForm(false); setEditing(null); load() }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>
    </div>
  )
}

// ─── Course Form ──────────────────────────────────────────────────
function CourseForm({ initial, onSuccess, onCancel }: { initial?: any; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    code:          initial?.code          || '',
    name:          initial?.name          || '',
    description:   initial?.description   || '',
    durationMonth: initial?.durationMonth || '3',
    fee:           initial?.fee           || '',
    status:        initial?.status ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const f = (field: string) => ({
    value: (form as any)[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [field]: e.target.value }),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const method = initial ? 'PUT' : 'POST'
    const url    = initial ? `/api/courses/${initial.id}` : '/api/courses'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, status: Boolean(form.status) }),
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
          <label className="label">Course Code *</label>
          <input className="input" placeholder="ENG-01" required {...f('code')} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status ? 'true' : 'false'}
            onChange={e => setForm({ ...form, status: e.target.value === 'true' })}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Course Name *</label>
          <input className="input" placeholder="English Level 1" required {...f('name')} />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="Course description..." {...f('description')} />
        </div>
        <div>
          <label className="label">Duration (months) *</label>
          <input type="number" min="1" max="36" className="input" required {...f('durationMonth')} />
        </div>
        <div>
          <label className="label">Fee (USD) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
            <input type="number" step="0.01" min="0" className="input pl-7" placeholder="0.00" required {...f('fee')} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Save Changes' : 'Add Course'}
        </button>
      </div>
    </form>
  )
}

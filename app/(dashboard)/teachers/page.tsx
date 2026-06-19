'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { formatCurrency } from '@/lib/utils'

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<any>(null)
  const [viewTeacher, setViewTeacher] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    const res  = await fetch(`/api/teachers?${params}`)
    const data = await res.json()
    setTeachers(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deactivate teacher "${name}"?`)) return
    await fetch(`/api/teachers/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleExportExcel() {
    const res  = await fetch('/api/reports?type=teachers&format=excel')
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `teachers-${Date.now()}.xlsx`; a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      key: 'teacherCode', header: 'Code',
      render: (t: any) => (
        <span className="font-mono text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded">
          {t.teacherCode}
        </span>
      ),
    },
    {
      key: 'fullName', header: 'Teacher',
      render: (t: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold flex-shrink-0">
            {t.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900">{t.fullName}</p>
            <p className="text-xs text-slate-400">{t.email || t.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'gender',         header: 'Gender',         render: (t: any) => <span className="text-slate-600">{t.gender}</span> },
    { key: 'specialization', header: 'Specialization', render: (t: any) => <span className="badge badge-purple">{t.specialization || '—'}</span> },
    {
      key: 'classes', header: 'Classes',
      render: (t: any) => (
        <div className="flex flex-wrap gap-1">
          {t.classes?.length > 0
            ? t.classes.slice(0, 2).map((c: any) => (
                <span key={c.id} className="badge badge-blue text-xs">{c.course?.name}</span>
              ))
            : <span className="text-slate-400 text-xs">No class</span>}
          {t.classes?.length > 2 && (
            <span className="badge badge-gray text-xs">+{t.classes.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      key: 'salary', header: 'Salary',
      render: (t: any) => (
        <span className="font-medium text-slate-700">
          {t.salary ? formatCurrency(Number(t.salary)) : '—'}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (t: any) => <StatusBadge status={t.isActive ? 'ACTIVE' : 'DROPPED'} />,
    },
    {
      key: 'actions', header: '',
      render: (t: any) => (
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); setViewTeacher(t) }} className="btn-icon text-indigo-600" title="View">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={e => { e.stopPropagation(); setEditing(t); setShowForm(true) }} className="btn-icon text-amber-600" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={e => { e.stopPropagation(); handleDelete(t.id, t.fullName) }} className="btn-icon text-red-500" title="Deactivate">
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
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">{total} teachers registered</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <DataTable
        data={teachers}
        columns={columns}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        onSearch={q => { setSearch(q); setPage(1) }}
        searchPlaceholder="Search by name, code, specialization..."
        onExportExcel={handleExportExcel}
        loading={loading}
        rowKey={t => t.id}
        onRowClick={t => setViewTeacher(t)}
        emptyMessage="No teachers found"
      />

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Teacher' : 'Add New Teacher'}
        size="lg"
      >
        <TeacherForm
          initial={editing}
          onSuccess={() => { setShowForm(false); setEditing(null); load() }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        open={!!viewTeacher}
        onClose={() => setViewTeacher(null)}
        title="Teacher Profile"
        size="md"
      >
        {viewTeacher && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 text-2xl font-bold">
                {viewTeacher.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewTeacher.fullName}</h3>
                <p className="text-slate-500 text-sm font-mono">{viewTeacher.teacherCode}</p>
                {viewTeacher.specialization && (
                  <span className="badge badge-purple mt-1">{viewTeacher.specialization}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Gender',  value: viewTeacher.gender },
                { label: 'Phone',   value: viewTeacher.phone || '—' },
                { label: 'Email',   value: viewTeacher.email || '—' },
                { label: 'Address', value: viewTeacher.address || '—' },
                { label: 'Salary',  value: viewTeacher.salary ? formatCurrency(Number(viewTeacher.salary)) : '—' },
                { label: 'Status',  value: viewTeacher.isActive ? 'Active' : 'Inactive' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                  <p className="font-medium text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>

            {viewTeacher.classes?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Active Classes</p>
                <div className="space-y-2">
                  {viewTeacher.classes.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{c.className}</p>
                        <p className="text-xs text-slate-400">{c.course?.name}</p>
                      </div>
                      {c.shift && <span className="badge badge-blue">{c.shift.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── Teacher Form ─────────────────────────────────────────────────
function TeacherForm({ initial, onSuccess, onCancel }: { initial?: any; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    teacherCode:    initial?.teacherCode    || '',
    fullName:       initial?.fullName       || '',
    gender:         initial?.gender         || 'Male',
    phone:          initial?.phone          || '',
    email:          initial?.email          || '',
    address:        initial?.address        || '',
    specialization: initial?.specialization || '',
    salary:         initial?.salary         || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const f = (field: string) => ({
    value: (form as any)[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [field]: e.target.value }),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const method = initial ? 'PUT' : 'POST'
    const url    = initial ? `/api/teachers/${initial.id}` : '/api/teachers'
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
        <div className="col-span-2">
          <label className="label">Full Name *</label>
          <input className="input" placeholder="Chan Dara" required {...f('fullName')} />
        </div>
        <div>
          <label className="label">Gender *</label>
          <select className="input" required {...f('gender')}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div>
          <label className="label">Teacher Code</label>
          <input className="input" placeholder="TCH001 (auto)" {...f('teacherCode')} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" placeholder="012 345 678" {...f('phone')} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="teacher@school.com" {...f('email')} />
        </div>
        <div>
          <label className="label">Specialization</label>
          <input className="input" placeholder="English, Computer, Chinese..." {...f('specialization')} />
        </div>
        <div>
          <label className="label">Monthly Salary ($)</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00" {...f('salary')} />
        </div>
        <div className="col-span-2">
          <label className="label">Address</label>
          <input className="input" placeholder="Phnom Penh, Cambodia" {...f('address')} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Save Changes' : 'Add Teacher'}
        </button>
      </div>
    </form>
  )
}

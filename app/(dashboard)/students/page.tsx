'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { StudentForm } from '@/components/students/StudentForm'
import { formatDate } from '@/lib/utils'

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<any>(null)
  const [filter, setFilter]     = useState<'all' | 'active' | 'inactive'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (filter !== 'all') params.set('status', filter)

    const res  = await fetch(`/api/students?${params}`)
    const data = await res.json()
    setStudents(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search, filter])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deactivate student "${name}"?`)) return
    await fetch(`/api/students/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleExportExcel() {
    const res = await fetch(`/api/reports?type=students&format=excel`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `students-${Date.now()}.xlsx`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleExportPDF() {
    const res = await fetch(`/api/reports?type=students&format=pdf`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  function handlePrint() { window.print() }

  const columns = [
    {
      key: 'studentCode', header: 'Code',
      render: (s: any) => <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{s.studentCode}</span>,
    },
    {
      key: 'fullName', header: 'Student',
      render: (s: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
            {s.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900">{s.fullName}</p>
            <p className="text-xs text-slate-400">{s.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'gender', header: 'Gender', render: (s: any) => <span className="text-slate-600">{s.gender}</span> },
    {
      key: 'enrollments', header: 'Enrolled',
      render: (s: any) => (
        <span className="badge badge-blue">{s.enrollments?.length || 0} course(s)</span>
      ),
    },
    {
      key: 'registerDate', header: 'Register Date',
      render: (s: any) => <span className="text-slate-500 text-xs">{formatDate(s.registerDate)}</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (s: any) => <StatusBadge status={s.isActive ? 'ACTIVE' : 'DROPPED'} />,
    },
    {
      key: 'actions', header: 'Actions',
      render: (s: any) => (
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); router.push(`/students/${s.id}`) }}
            className="btn-icon text-indigo-600" title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setEditing(s); setShowForm(true) }}
            className="btn-icon text-amber-600" title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleDelete(s.id, s.fullName) }}
            className="btn-icon text-red-500" title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{total} total students</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
              ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <DataTable
        data={students}
        columns={columns}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        onSearch={q => { setSearch(q); setPage(1) }}
        searchPlaceholder="Search by name, code, phone..."
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onPrint={handlePrint}
        loading={loading}
        rowKey={s => s.id}
        onRowClick={s => router.push(`/students/${s.id}`)}
        emptyMessage="No students found"
      />

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <StudentForm
          initial={editing}
          onSuccess={() => { setShowForm(false); setEditing(null); load() }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Props {
  initial?: any
  onSuccess: () => void
  onCancel: () => void
}

export function StudentForm({ initial, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    fullName:    initial?.fullName    || '',
    gender:      initial?.gender      || 'Male',
    dob:         initial?.dob         ? formatDate(initial.dob, 'yyyy-MM-dd') : '',
    phone:       initial?.phone       || '',
    parentPhone: initial?.parentPhone || '',
    address:     initial?.address     || '',
    studentCode: initial?.studentCode || '',
    registerDate: initial?.registerDate ? formatDate(initial.registerDate, 'yyyy-MM-dd') : new Date().toISOString().slice(0, 10),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const method  = initial ? 'PUT' : 'POST'
    const url     = initial ? `/api/students/${initial.id}` : '/api/students'
    const res     = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to save')
      setLoading(false)
      return
    }

    onSuccess()
  }

  const f = (field: string) => ({
    value: (form as any)[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [field]: e.target.value }),
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Full Name *</label>
          <input className="input" placeholder="e.g. Chan Dara" required {...f('fullName')} />
        </div>

        <div>
          <label className="label">Gender *</label>
          <select className="input" required {...f('gender')}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="label">Date of Birth</label>
          <input type="date" className="input" {...f('dob')} />
        </div>

        <div>
          <label className="label">Phone</label>
          <input className="input" placeholder="012 345 678" {...f('phone')} />
        </div>

        <div>
          <label className="label">Parent Phone</label>
          <input className="input" placeholder="012 000 000" {...f('parentPhone')} />
        </div>

        <div className="col-span-2">
          <label className="label">Address</label>
          <input className="input" placeholder="Phnom Penh, Cambodia" {...f('address')} />
        </div>

        <div>
          <label className="label">Student Code</label>
          <input className="input" placeholder="Auto-generated" {...f('studentCode')} />
          <p className="text-xs text-slate-400 mt-1">Leave blank for auto-generate</p>
        </div>

        <div>
          <label className="label">Register Date</label>
          <input type="date" className="input" {...f('registerDate')} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Save Changes' : 'Add Student'}
        </button>
      </div>
    </form>
  )
}

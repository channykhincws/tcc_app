'use client'
import { useState, useEffect, useCallback } from 'react'
import { CalendarCheck, Save, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AttendancePage() {
  const [classes, setClasses]     = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents]   = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [notes, setNotes]         = useState<Record<string, string>>({})
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  // Load classes
  useEffect(() => {
    fetch('/api/classes?limit=100')
      .then(r => r.json())
      .then(d => setClasses(d.data || []))
  }, [])

  // Load students + existing attendance when class/date changes
  const loadAttendance = useCallback(async () => {
    if (!selectedClass) return
    setLoading(true)
    setSaved(false)

    // Get enrollments for this class
    const [enrRes, attRes] = await Promise.all([
      fetch(`/api/enrollments?classId=${selectedClass}&status=ACTIVE&limit=100`),
      fetch(`/api/attendance?classId=${selectedClass}&date=${date}&limit=100`),
    ])
    const [enrData, attData] = await Promise.all([enrRes.json(), attRes.json()])

    const studentList = (enrData.data || []).map((e: any) => e.student).filter(Boolean)
    setStudents(studentList)

    // Pre-fill existing attendance
    const existing: Record<string, string> = {}
    ;(attData.data || []).forEach((a: any) => { existing[a.studentId] = a.status })

    // Default to PRESENT for unmarked
    const defaults: Record<string, string> = {}
    studentList.forEach((s: any) => {
      defaults[s.id] = existing[s.id] || 'PRESENT'
    })
    setAttendance(defaults)
    setLoading(false)
  }, [selectedClass, date])

  useEffect(() => { loadAttendance() }, [loadAttendance])

  function setAll(status: string) {
    const next: Record<string, string> = {}
    students.forEach(s => { next[s.id] = status })
    setAttendance(next)
  }

  async function handleSave() {
    if (!selectedClass || students.length === 0) return
    setSaving(true)

    const records = students.map(s => ({
      classId:        selectedClass,
      studentId:      s.id,
      attendanceDate: date,
      status:         attendance[s.id] || 'PRESENT',
      note:           notes[s.id] || null,
    }))

    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    })

    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  const counts = {
    present: Object.values(attendance).filter(v => v === 'PRESENT').length,
    absent:  Object.values(attendance).filter(v => v === 'ABSENT').length,
    late:    Object.values(attendance).filter(v => v === 'LATE').length,
  }

  const selectedClassInfo = classes.find(c => c.id === selectedClass)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Mark student attendance by class and date</p>
        </div>
        {students.length > 0 && (
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Attendance'}
          </button>
        )}
      </div>

      {/* Selector */}
      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Class *</label>
            <select
              className="input"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">— Choose a class —</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.className} ({cls.course?.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        {selectedClassInfo && (
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
            <span className="text-slate-500">Teacher: <strong className="text-slate-800">{selectedClassInfo.teacher?.fullName || '—'}</strong></span>
            <span className="text-slate-500">Shift: <strong className="text-slate-800">{selectedClassInfo.shift?.name || '—'}</strong></span>
            <span className="text-slate-500">Room: <strong className="text-slate-800">{selectedClassInfo.room || '—'}</strong></span>
            <span className="text-slate-500">Students: <strong className="text-slate-800">{students.length}</strong></span>
          </div>
        )}
      </div>

      {/* Summary + Bulk actions */}
      {students.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-emerald-700">{counts.present} Present</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-sm">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-700">{counts.absent} Absent</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-700">{counts.late} Late</span>
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <span className="text-sm text-slate-500 self-center">Set all:</span>
            <button onClick={() => setAll('PRESENT')} className="btn-secondary btn-sm text-emerald-700 border-emerald-300 hover:bg-emerald-50">
              All Present
            </button>
            <button onClick={() => setAll('ABSENT')} className="btn-secondary btn-sm text-red-700 border-red-300 hover:bg-red-50">
              All Absent
            </button>
            <button onClick={() => setAll('LATE')} className="btn-secondary btn-sm text-amber-700 border-amber-300 hover:bg-amber-50">
              All Late
            </button>
          </div>
        </div>
      )}

      {/* Attendance list */}
      {loading ? (
        <div className="card p-8 text-center text-slate-400">Loading students...</div>
      ) : !selectedClass ? (
        <div className="card p-12 text-center">
          <CalendarCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">Select a class to start marking attendance</p>
        </div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400">No active students enrolled in this class</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">
              {selectedClassInfo?.className} — {formatDate(date)}
            </h3>
            {saved && (
              <span className="text-emerald-600 text-sm font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Attendance saved
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {students.map((student, idx) => {
              const status = attendance[student.id] || 'PRESENT'
              return (
                <div key={student.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                  {/* Index */}
                  <span className="w-7 text-center text-xs text-slate-400 font-medium">{idx + 1}</span>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold flex-shrink-0">
                    {student.fullName.charAt(0)}
                  </div>

                  {/* Name + code */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{student.fullName}</p>
                    <p className="text-xs text-slate-400 font-mono">{student.studentCode}</p>
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-2">
                    {(['PRESENT', 'LATE', 'ABSENT'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setAttendance(prev => ({ ...prev, [student.id]: s }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          status === s
                            ? s === 'PRESENT' ? 'bg-emerald-600 text-white shadow-sm'
                              : s === 'ABSENT' ? 'bg-red-600 text-white shadow-sm'
                              : 'bg-amber-500 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {s === 'PRESENT' ? '✓ Present' : s === 'ABSENT' ? '✗ Absent' : '⏱ Late'}
                      </button>
                    ))}
                  </div>

                  {/* Note */}
                  <input
                    type="text"
                    placeholder="Note"
                    value={notes[student.id] || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                    className="input w-32 py-1.5 text-xs"
                  />
                </div>
              )
            })}
          </div>

          <div className="px-5 py-4 border-t border-slate-200 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

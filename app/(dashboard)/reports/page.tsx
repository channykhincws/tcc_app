'use client'
import { useState } from 'react'
import { BarChart3, Download, FileText, Users, CreditCard, CalendarCheck, Loader2 } from 'lucide-react'

type ReportType = 'financial' | 'students' | 'attendance' | 'outstanding'

interface ReportConfig {
  type:  ReportType
  label: string
  icon:  React.ReactNode
  color: string
  desc:  string
  hasDateRange:  boolean
  hasClassFilter: boolean
}

const REPORTS: ReportConfig[] = [
  {
    type: 'financial', label: 'Financial Report', icon: <CreditCard className="w-6 h-6" />,
    color: 'bg-emerald-50 text-emerald-600', desc: 'Revenue, payments, and invoice summary',
    hasDateRange: true, hasClassFilter: false,
  },
  {
    type: 'students', label: 'Students Report', icon: <Users className="w-6 h-6" />,
    color: 'bg-blue-50 text-blue-600', desc: 'Student registration list and profile data',
    hasDateRange: true, hasClassFilter: false,
  },
  {
    type: 'attendance', label: 'Attendance Report', icon: <CalendarCheck className="w-6 h-6" />,
    color: 'bg-amber-50 text-amber-600', desc: 'Present, absent, late records by class',
    hasDateRange: true, hasClassFilter: true,
  },
  {
    type: 'outstanding', label: 'Outstanding Payments', icon: <FileText className="w-6 h-6" />,
    color: 'bg-red-50 text-red-600', desc: 'Unpaid and partial payment students',
    hasDateRange: false, hasClassFilter: false,
  },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null)
  const [startDate, setStartDate]   = useState('')
  const [endDate, setEndDate]       = useState('')
  const [classId, setClassId]       = useState('')
  const [classes, setClasses]       = useState<any[]>([])
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPDF, setLoadingPDF]     = useState(false)
  const [summary, setSummary]           = useState<any>(null)
  const [previewData, setPreviewData]   = useState<any[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)

  async function handleSelect(report: ReportConfig) {
    setSelectedReport(report)
    setSummary(null)
    setPreviewData([])
    if (report.hasClassFilter) {
      const res  = await fetch('/api/classes?limit=100')
      const data = await res.json()
      setClasses(data.data || [])
    }
  }

  function buildParams(format?: string) {
    const params = new URLSearchParams({ type: selectedReport!.type })
    if (format)    params.set('format', format)
    if (startDate) params.set('startDate', startDate)
    if (endDate)   params.set('endDate', endDate)
    if (classId)   params.set('classId', classId)
    return params.toString()
  }

  async function handlePreview() {
    if (!selectedReport) return
    setLoadingPreview(true)
    const res  = await fetch(`/api/reports?${buildParams()}`)
    const data = await res.json()
    setPreviewData(data.data || [])
    setSummary(data.summary || null)
    setLoadingPreview(false)
  }

  async function handleDownload(format: 'excel' | 'pdf') {
    if (!selectedReport) return
    const setter = format === 'excel' ? setLoadingExcel : setLoadingPDF
    setter(true)
    const res  = await fetch(`/api/reports?${buildParams(format)}`)
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const ext  = format === 'excel' ? 'xlsx' : 'pdf'
    const a    = document.createElement('a')
    a.href = url; a.download = `${selectedReport.type}-report-${Date.now()}.${ext}`; a.click()
    URL.revokeObjectURL(url)
    setter(false)
  }

  const today    = new Date().toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Export and analyze school data</p>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORTS.map(report => (
          <button
            key={report.type}
            onClick={() => handleSelect(report)}
            className={`card p-5 text-left hover:shadow-md transition-all hover:-translate-y-0.5
              ${selectedReport?.type === report.type ? 'ring-2 ring-indigo-500 shadow-md' : ''}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${report.color}`}>
              {report.icon}
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">{report.label}</h3>
            <p className="text-xs text-slate-500 mt-1">{report.desc}</p>
          </button>
        ))}
      </div>

      {/* Report Options */}
      {selectedReport && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedReport.color}`}>
              {selectedReport.icon}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{selectedReport.label}</h3>
              <p className="text-sm text-slate-500">{selectedReport.desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {selectedReport.hasDateRange && (
              <>
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date" className="input"
                    value={startDate || monthAgo}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date" className="input"
                    value={endDate || today}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            {selectedReport.hasClassFilter && (
              <div>
                <label className="label">Class (optional)</label>
                <select className="input" value={classId} onChange={e => setClassId(e.target.value)}>
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Quick presets */}
          {selectedReport.hasDateRange && (
            <div className="flex gap-2 mb-5">
              <span className="text-xs text-slate-500 self-center">Quick:</span>
              {[
                { label: 'Today',     start: today, end: today },
                { label: 'This week', start: new Date(Date.now() - 7*86400000).toISOString().slice(0,10), end: today },
                { label: 'This month',start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10), end: today },
                { label: 'This year', start: `${new Date().getFullYear()}-01-01`, end: today },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => { setStartDate(p.start); setEndDate(p.end) }}
                  className="px-3 py-1 text-xs border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handlePreview} disabled={loadingPreview} className="btn-secondary">
              {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              Preview
            </button>
            <button onClick={() => handleDownload('excel')} disabled={loadingExcel} className="btn-success">
              {loadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export Excel
            </button>
            <button onClick={() => handleDownload('pdf')} disabled={loadingPDF} className="btn-secondary">
              {loadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export PDF
            </button>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
              {Object.entries(summary).map(([key, val]) => (
                <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {typeof val === 'number' && key.toLowerCase().includes('amount') || key.toLowerCase().includes('revenue') || key.toLowerCase().includes('due')
                      ? `$${Number(val).toFixed(2)}`
                      : String(val)}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div className="mt-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-700">Preview ({previewData.length} records)</h4>
                <span className="text-xs text-slate-400">Showing first 10</span>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      {selectedReport.type === 'financial' && (
                        <><th>Invoice</th><th>Student</th><th>Course</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th></>
                      )}
                      {selectedReport.type === 'students' && (
                        <><th>Code</th><th>Name</th><th>Gender</th><th>Phone</th><th>Registered</th></>
                      )}
                      {selectedReport.type === 'attendance' && (
                        <><th>Student</th><th>Class</th><th>Date</th><th>Status</th></>
                      )}
                      {selectedReport.type === 'outstanding' && (
                        <><th>Student</th><th>Course</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th></>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((row: any, i: number) => (
                      <tr key={i}>
                        {selectedReport.type === 'financial' && (
                          <>
                            <td className="font-mono text-xs">{row.invoiceNo}</td>
                            <td>{row.enrollment?.student?.fullName}</td>
                            <td>{row.enrollment?.course?.name}</td>
                            <td className="font-medium">${Number(row.finalAmount).toFixed(2)}</td>
                            <td className="text-emerald-600">${Number(row.paidAmount).toFixed(2)}</td>
                            <td className="text-red-600">${Number(row.dueAmount).toFixed(2)}</td>
                            <td>
                              <span className={`badge ${row.status === 'PAID' ? 'badge-green' : row.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>
                                {row.status}
                              </span>
                            </td>
                          </>
                        )}
                        {selectedReport.type === 'students' && (
                          <>
                            <td className="font-mono text-xs">{row.studentCode}</td>
                            <td className="font-medium">{row.fullName}</td>
                            <td>{row.gender}</td>
                            <td>{row.phone || '—'}</td>
                            <td className="text-xs text-slate-500">{new Date(row.registerDate).toLocaleDateString()}</td>
                          </>
                        )}
                        {selectedReport.type === 'attendance' && (
                          <>
                            <td className="font-medium">{row.student?.fullName}</td>
                            <td>{row.class?.className}</td>
                            <td className="text-xs text-slate-500">{new Date(row.attendanceDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${row.status === 'PRESENT' ? 'badge-green' : row.status === 'LATE' ? 'badge-yellow' : 'badge-red'}`}>
                                {row.status}
                              </span>
                            </td>
                          </>
                        )}
                        {selectedReport.type === 'outstanding' && (
                          <>
                            <td className="font-medium">{row.enrollment?.student?.fullName}</td>
                            <td>{row.enrollment?.course?.name}</td>
                            <td>${Number(row.finalAmount).toFixed(2)}</td>
                            <td className="text-emerald-600">${Number(row.paidAmount).toFixed(2)}</td>
                            <td className="text-red-600 font-semibold">${Number(row.dueAmount).toFixed(2)}</td>
                            <td>
                              <span className={`badge ${row.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>{row.status}</span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

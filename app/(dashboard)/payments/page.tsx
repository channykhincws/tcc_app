'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, CreditCard, DollarSign, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading]   = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [payAmount, setPayAmount]   = useState('')
  const [payMethod, setPayMethod]   = useState('CASH')
  const [payNote, setPayNote]       = useState('')
  const [paying, setPaying]         = useState(false)
  const [payError, setPayError]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const res  = await fetch(`/api/invoices?${params}`)
    const data = await res.json()
    setInvoices(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedInvoice || !payAmount) return
    setPaying(true)
    setPayError('')

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId: selectedInvoice.id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        note: payNote,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setPayError(data.error || 'Payment failed')
      setPaying(false)
      return
    }

    setSelectedInvoice(null)
    setPayAmount('')
    setPayNote('')
    load()
    setPaying(false)
  }

  async function handleExportExcel() {
    const res  = await fetch(`/api/reports?type=outstanding&format=excel`)
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `payments-${Date.now()}.xlsx`; a.click()
  }

  const totalPaid = invoices.reduce((s, i) => s + Number(i.paidAmount), 0)
  const totalDue  = invoices.reduce((s, i) => s + Number(i.dueAmount), 0)

  const columns = [
    {
      key: 'invoiceNo', header: 'Invoice',
      render: (inv: any) => (
        <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{inv.invoiceNo}</span>
      ),
    },
    {
      key: 'student', header: 'Student',
      render: (inv: any) => (
        <div>
          <p className="font-medium text-slate-900">{inv.enrollment?.student?.fullName}</p>
          <p className="text-xs text-slate-400">{inv.enrollment?.student?.phone}</p>
        </div>
      ),
    },
    {
      key: 'course', header: 'Course',
      render: (inv: any) => (
        <div>
          <p className="text-slate-700">{inv.enrollment?.course?.name}</p>
          <p className="text-xs text-slate-400">{inv.enrollment?.class?.className}</p>
        </div>
      ),
    },
    {
      key: 'finalAmount', header: 'Total',
      render: (inv: any) => <span className="font-medium">{formatCurrency(Number(inv.finalAmount))}</span>,
    },
    {
      key: 'paidAmount', header: 'Paid',
      render: (inv: any) => <span className="text-emerald-600 font-medium">{formatCurrency(Number(inv.paidAmount))}</span>,
    },
    {
      key: 'dueAmount', header: 'Due',
      render: (inv: any) => (
        <span className={Number(inv.dueAmount) > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}>
          {formatCurrency(Number(inv.dueAmount))}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (inv: any) => <StatusBadge status={inv.status} />,
    },
    {
      key: 'date', header: 'Date',
      render: (inv: any) => <span className="text-xs text-slate-400">{formatDate(inv.invoiceDate)}</span>,
    },
    {
      key: 'actions', header: '',
      render: (inv: any) => (
        inv.status !== 'PAID' ? (
          <button
            onClick={e => { e.stopPropagation(); setSelectedInvoice(inv); setPayAmount('') }}
            className="btn-success btn-sm"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Pay
          </button>
        ) : (
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        )
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments & Invoices</h1>
          <p className="page-subtitle">{total} invoices</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card border border-emerald-200">
          <div className="stat-icon bg-emerald-50 text-emerald-600"><DollarSign className="w-6 h-6" /></div>
          <div>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
            <p className="text-sm text-slate-500">Paid (this page)</p>
          </div>
        </div>
        <div className="stat-card border border-red-200">
          <div className="stat-icon bg-red-50 text-red-600"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totalDue)}</p>
            <p className="text-sm text-slate-500">Outstanding</p>
          </div>
        </div>
        <div className="stat-card border border-slate-200">
          <div className="stat-icon bg-slate-50 text-slate-600"><CreditCard className="w-6 h-6" /></div>
          <div>
            <p className="text-xl font-bold text-slate-900">{total}</p>
            <p className="text-sm text-slate-500">Total Invoices</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { val: '', label: 'All' },
          { val: 'UNPAID', label: 'Unpaid' },
          { val: 'PARTIAL', label: 'Partial' },
          { val: 'PAID', label: 'Paid' },
        ].map(f => (
          <button
            key={f.val}
            onClick={() => { setStatusFilter(f.val); setPage(1) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${statusFilter === f.val
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        data={invoices}
        columns={columns}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        onSearch={q => { setSearch(q); setPage(1) }}
        searchPlaceholder="Search by invoice, student name..."
        onExportExcel={handleExportExcel}
        loading={loading}
        rowKey={i => i.id}
        emptyMessage="No invoices found"
      />

      {/* Payment Modal */}
      <Modal
        open={!!selectedInvoice}
        onClose={() => { setSelectedInvoice(null); setPayError('') }}
        title="Record Payment"
        size="md"
      >
        {selectedInvoice && (
          <form onSubmit={handlePay} className="space-y-4">
            {/* Invoice info */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Invoice</span>
                <span className="font-mono font-medium">{selectedInvoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Student</span>
                <span className="font-medium">{selectedInvoice.enrollment?.student?.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Course</span>
                <span>{selectedInvoice.enrollment?.course?.name}</span>
              </div>
              <div className="border-t border-slate-200 my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Fee</span>
                <span className="font-medium">{formatCurrency(Number(selectedInvoice.finalAmount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Already Paid</span>
                <span className="text-emerald-600 font-medium">{formatCurrency(Number(selectedInvoice.paidAmount))}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-red-600">Due Amount</span>
                <span className="text-red-600">{formatCurrency(Number(selectedInvoice.dueAmount))}</span>
              </div>
            </div>

            {/* Payment history */}
            {selectedInvoice.payments?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Payment History</p>
                <div className="space-y-1">
                  {selectedInvoice.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-sm px-3 py-2 bg-emerald-50 rounded-lg">
                      <span className="text-slate-500">{formatDate(p.paymentDate)} · {p.paymentMethod}</span>
                      <span className="text-emerald-700 font-medium">{formatCurrency(Number(p.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{payError}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Payment Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={Number(selectedInvoice.dueAmount)}
                    className="input pl-7"
                    placeholder="0.00"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2 mt-1.5">
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setPayAmount(String((Number(selectedInvoice.dueAmount) * pct / 100).toFixed(2)))}
                      className="px-2 py-0.5 text-xs border border-slate-200 rounded hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(Number(selectedInvoice.dueAmount).toFixed(2)))}
                    className="px-2 py-0.5 text-xs border border-slate-200 rounded hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                  >
                    Full
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="QR">QR Code</option>
                </select>
              </div>

              <div>
                <label className="label">Note</label>
                <input className="input" placeholder="Optional note" value={payNote} onChange={e => setPayNote(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setSelectedInvoice(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={paying} className="btn-success flex-1">
                {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Payment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

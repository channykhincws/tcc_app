'use client'
import { useEffect, useState } from 'react'
import {
  Users, GraduationCap, BookOpen, DollarSign,
  AlertTriangle, Clock, TrendingUp, XCircle, School
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface DashboardData {
  stats: {
    totalStudents: number
    activeStudents: number
    totalTeachers: number
    totalCourses: number
    monthlyRevenue: number
    unpaidAmount: number
    todayClassCount: number
    newStudentsToday: number
    newStudentsMonth: number
  }
  todayClasses: any[]
  alerts: any[]
  chartData: { month: string; revenue: number }[]
}

const STAT_CARDS = [
  { key: 'totalStudents',   label: 'Total Students',    icon: Users,         color: 'bg-blue-50 text-blue-600',    border: 'border-blue-200' },
  { key: 'activeStudents',  label: 'Active Students',   icon: TrendingUp,    color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200' },
  { key: 'totalTeachers',   label: 'Teachers',          icon: GraduationCap, color: 'bg-violet-50 text-violet-600', border: 'border-violet-200' },
  { key: 'totalCourses',    label: 'Active Courses',    icon: BookOpen,      color: 'bg-amber-50 text-amber-600',  border: 'border-amber-200' },
]

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-28 bg-slate-100" />
          ))}
        </div>
      </div>
    )
  }

  const stats = data?.stats
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{today}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => {
          const Icon = card.icon
          const value = (stats as any)?.[card.key] ?? 0
          return (
            <div key={card.key} className={`stat-card border ${card.border}`}>
              <div className={`stat-icon ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue + Unpaid row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card border border-indigo-200 md:col-span-1">
          <div className="stat-icon bg-indigo-50 text-indigo-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
            <p className="text-sm text-slate-500 mt-0.5">Monthly Revenue</p>
            <p className="text-xs text-slate-400 mt-1">+{stats?.newStudentsMonth || 0} new students this month</p>
          </div>
        </div>
        <div className="stat-card border border-red-200 md:col-span-1">
          <div className="stat-icon bg-red-50 text-red-600">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(stats?.unpaidAmount || 0)}</p>
            <p className="text-sm text-slate-500 mt-0.5">Unpaid Amount</p>
            <p className="text-xs text-slate-400 mt-1">Requires follow-up</p>
          </div>
        </div>
        <div className="stat-card border border-amber-200 md:col-span-1">
          <div className="stat-icon bg-amber-50 text-amber-600">
            <School className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats?.todayClassCount || 0}</p>
            <p className="text-sm text-slate-500 mt-0.5">Today's Classes</p>
            <p className="text-xs text-slate-400 mt-1">{stats?.newStudentsToday || 0} new students today</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-4">Monthly Revenue (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.chartData || []} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${v}`} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Alerts</h3>
            <span className="badge badge-red">{data?.alerts?.length || 0}</span>
          </div>
          <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
            {(data?.alerts || []).length === 0 && (
              <p className="text-center py-6 text-slate-400 text-sm">No alerts</p>
            )}
            {(data?.alerts || []).map((alert, i) => (
              <div key={i} className={
                alert.type === 'DUE_PAYMENT' ? 'alert-danger' :
                alert.type === 'COURSE_ENDING' ? 'alert-warning' : 'alert-info'
              }>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Today's Classes</h3>
          <span className="text-sm text-slate-500">{data?.todayClasses?.length || 0} active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Course</th>
                <th>Teacher</th>
                <th>Shift</th>
                <th>Room</th>
                <th>Students</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.todayClasses || []).length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No classes today</td></tr>
              ) : (
                (data?.todayClasses || []).map((cls: any) => (
                  <tr key={cls.id}>
                    <td>
                      <p className="font-medium text-slate-900">{cls.className}</p>
                      <p className="text-xs text-slate-400">{cls.classCode}</p>
                    </td>
                    <td className="text-slate-600">{cls.course?.name}</td>
                    <td className="text-slate-600">{cls.teacher?.fullName || '—'}</td>
                    <td>
                      {cls.shift && (
                        <span className="badge badge-blue">{cls.shift.name}</span>
                      )}
                    </td>
                    <td className="text-slate-600">{cls.room || '—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-16">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, (cls._count.enrollments / cls.maxStudent) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{cls._count.enrollments}/{cls.maxStudent}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={cls.isActive ? 'ACTIVE' : 'COMPLETED'} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

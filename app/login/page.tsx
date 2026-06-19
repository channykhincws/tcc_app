'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include', // Important: include cookies
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Use window.location for hard redirect to ensure middleware picks up cookie
      window.location.href = '/dashboard'

    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const demoAccounts = [
    { label: 'Super Admin', email: 'superadmin@school.com' },
    { label: 'Admin',       email: 'admin@school.com' },
    { label: 'Accountant',  email: 'accountant@school.com' },
    { label: 'Teacher',     email: 'chandara@school.com' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">School Management</h1>
          <p className="text-indigo-300 mt-1 text-sm">Training Center System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="admin@school.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Demo Accounts (click to fill)
            </p>
            <div className="space-y-1.5">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => setForm({ email: acc.email, password: 'Admin@123' })}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-xs border border-transparent hover:border-indigo-200"
                >
                  <span className="font-semibold text-indigo-700">{acc.label}</span>
                  <span className="text-slate-400 ml-2">{acc.email}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-200">
              Password: <span className="font-mono font-semibold">Admin@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

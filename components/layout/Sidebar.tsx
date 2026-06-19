'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, School,
  ClipboardList, CreditCard, CalendarCheck, BarChart3,
  Settings, LogOut, ChevronRight, GraduationCapIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JWTPayload } from '@/types'
import { getNavItems } from '@/lib/permissions'

const ICONS: Record<string, React.ReactNode> = {
  LayoutDashboard:  <LayoutDashboard  className="w-5 h-5" />,
  Users:            <Users            className="w-5 h-5" />,
  GraduationCap:    <GraduationCap    className="w-5 h-5" />,
  BookOpen:         <BookOpen         className="w-5 h-5" />,
  School:           <School           className="w-5 h-5" />,
  ClipboardList:    <ClipboardList    className="w-5 h-5" />,
  CreditCard:       <CreditCard       className="w-5 h-5" />,
  CalendarCheck:    <CalendarCheck    className="w-5 h-5" />,
  BarChart3:        <BarChart3        className="w-5 h-5" />,
}

interface Props { user: JWTPayload }

export function Sidebar({ user }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const navItems  = getNavItems(user.role)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-violet-600',
    ADMIN:       'bg-indigo-600',
    ACCOUNTANT:  'bg-emerald-600',
    TEACHER:     'bg-amber-600',
  }
  const roleBadge = roleColors[user.role] || 'bg-indigo-600'

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">ABC Training</p>
            <p className="text-slate-400 text-xs">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              {ICONS[item.icon]}
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 border-t border-slate-700/50 pt-3 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-all"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold', roleBadge)}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.name}</p>
            <p className="text-slate-500 text-xs">{user.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

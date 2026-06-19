'use client'
import { useState } from 'react'
import { Bell, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { JWTPayload } from '@/types'

interface Props { user: JWTPayload }

export function Header({ user }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) router.push(`/students?search=${encodeURIComponent(search)}`)
  }

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center gap-4 px-6 flex-shrink-0">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-400 transition-all"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <button className="relative btn-icon">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

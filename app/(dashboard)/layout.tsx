import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

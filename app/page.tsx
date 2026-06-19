import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default function RootPage() {
  const user = getCurrentUser()
  if (!user) redirect('/login')

  if (user.role === 'TEACHER') redirect('/attendance')
  if (user.role === 'ACCOUNTANT') redirect('/payments')
  redirect('/dashboard')
}

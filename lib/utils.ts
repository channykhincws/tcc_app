import { format, formatDistance } from 'date-fns'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  return format(new Date(date), fmt)
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  if (currency === 'USD') return `$${Number(amount).toFixed(2)}`
  return new Intl.NumberFormat('km-KH', { style: 'currency', currency }).format(amount)
}

export function timeAgo(date: string | Date): string {
  return formatDistance(new Date(date), new Date(), { addSuffix: true })
}

export function generateCode(prefix: string, count: number): string {
  return `${prefix}${String(count + 1).padStart(3, '0')}`
}

export function generateInvoiceNo(count: number): string {
  const year = new Date().getFullYear()
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`
}

export function calculateRemainingDays(endDate: string | Date): number {
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    UNPAID: 'bg-red-100 text-red-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-gray-100 text-gray-700',
    DROPPED: 'bg-red-100 text-red-700',
    PRESENT: 'bg-green-100 text-green-800',
    ABSENT: 'bg-red-100 text-red-800',
    LATE: 'bg-yellow-100 text-yellow-800',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
    totalPages: Math.ceil(items.length / limit),
  }
}

export function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v))
  })
  return sp.toString()
}

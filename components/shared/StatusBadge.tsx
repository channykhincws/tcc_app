import { cn, getStatusColor } from '@/lib/utils'

interface Props {
  status: string
  className?: string
}

const LABELS: Record<string, string> = {
  PAID: 'Paid', PARTIAL: 'Partial', UNPAID: 'Unpaid',
  ACTIVE: 'Active', COMPLETED: 'Completed', DROPPED: 'Dropped',
  PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late',
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', ACCOUNTANT: 'Accountant', TEACHER: 'Teacher',
}

export function StatusBadge({ status, className }: Props) {
  return (
    <span className={cn('badge', getStatusColor(status), className)}>
      {LABELS[status] || status}
    </span>
  )
}

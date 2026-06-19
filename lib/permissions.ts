import type { Role } from '@/types'

type Permission =
  | 'students:read' | 'students:write' | 'students:delete'
  | 'teachers:read' | 'teachers:write' | 'teachers:delete'
  | 'courses:read' | 'courses:write' | 'courses:delete'
  | 'classes:read' | 'classes:write' | 'classes:delete'
  | 'enrollments:read' | 'enrollments:write' | 'enrollments:delete'
  | 'payments:read' | 'payments:write'
  | 'invoices:read' | 'invoices:write'
  | 'attendance:read' | 'attendance:write'
  | 'reports:read'
  | 'settings:read' | 'settings:write'
  | 'users:read' | 'users:write' | 'users:delete'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'students:read', 'students:write', 'students:delete',
    'teachers:read', 'teachers:write', 'teachers:delete',
    'courses:read', 'courses:write', 'courses:delete',
    'classes:read', 'classes:write', 'classes:delete',
    'enrollments:read', 'enrollments:write', 'enrollments:delete',
    'payments:read', 'payments:write',
    'invoices:read', 'invoices:write',
    'attendance:read', 'attendance:write',
    'reports:read',
    'settings:read', 'settings:write',
    'users:read', 'users:write', 'users:delete',
  ],
  ADMIN: [
    'students:read', 'students:write', 'students:delete',
    'teachers:read', 'teachers:write',
    'courses:read', 'courses:write',
    'classes:read', 'classes:write',
    'enrollments:read', 'enrollments:write',
    'attendance:read',
    'reports:read',
    'invoices:read',
    'payments:read',
  ],
  ACCOUNTANT: [
    'students:read',
    'enrollments:read',
    'payments:read', 'payments:write',
    'invoices:read', 'invoices:write',
    'reports:read',
  ],
  TEACHER: [
    'students:read',
    'classes:read',
    'attendance:read', 'attendance:write',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canAccess(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

export function getNavItems(role: Role) {
  const allItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', permission: null },
    { href: '/students', label: 'Students', icon: 'Users', permission: 'students:read' as Permission },
    { href: '/teachers', label: 'Teachers', icon: 'GraduationCap', permission: 'teachers:read' as Permission },
    { href: '/courses', label: 'Courses', icon: 'BookOpen', permission: 'courses:read' as Permission },
    { href: '/classes', label: 'Classes', icon: 'School', permission: 'classes:read' as Permission },
    { href: '/enrollments', label: 'Enrollments', icon: 'ClipboardList', permission: 'enrollments:read' as Permission },
    { href: '/payments', label: 'Payments', icon: 'CreditCard', permission: 'payments:read' as Permission },
    { href: '/attendance', label: 'Attendance', icon: 'CalendarCheck', permission: 'attendance:read' as Permission },
    { href: '/reports', label: 'Reports', icon: 'BarChart3', permission: 'reports:read' as Permission },
  ]

  return allItems.filter(item =>
    item.permission === null || hasPermission(role, item.permission)
  )
}

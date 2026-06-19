'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export function Modal({ open, onClose, title, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-backdrop animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={cn('modal w-full', SIZES[size])}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

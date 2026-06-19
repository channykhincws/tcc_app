'use client'
import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Download, Printer, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  total?: number
  page?: number
  limit?: number
  onPageChange?: (page: number) => void
  onSearch?: (q: string) => void
  searchPlaceholder?: string
  actions?: React.ReactNode
  onExportExcel?: () => void
  onExportPDF?: () => void
  onPrint?: () => void
  loading?: boolean
  emptyMessage?: string
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  data, columns, total = 0, page = 1, limit = 20, onPageChange,
  onSearch, searchPlaceholder = 'Search...', actions,
  onExportExcel, onExportPDF, onPrint,
  loading, emptyMessage = 'No records found.', rowKey, onRowClick,
}: Props<T>) {
  const [searchVal, setSearchVal] = useState('')
  const totalPages = Math.ceil(total / limit)

  function handleSearch(val: string) {
    setSearchVal(val)
    onSearch?.(val)
  }

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 flex-wrap">
        {onSearch && (
          <div className="relative flex-1 min-w-48 max-w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchVal}
              onChange={e => handleSearch(e.target.value)}
              className="input pl-9 pr-8 py-1.5"
            />
            {searchVal && (
              <button onClick={() => handleSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {actions}
          {onExportExcel && (
            <button onClick={onExportExcel} className="btn-secondary btn-sm gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          )}
          {onExportPDF && (
            <button onClick={onExportPDF} className="btn-secondary btn-sm gap-1.5">
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          )}
          {onPrint && (
            <button onClick={onPrint} className="btn-secondary btn-sm gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={col.className}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key}>
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Filter className="w-6 h-6 text-slate-300" />
                    </div>
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {columns.map(col => (
                    <td key={col.key} className={col.className}>
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm">
          <span className="text-slate-500">
            Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="btn-icon disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1
              if (totalPages > 5) {
                if (page <= 3)       p = i + 1
                else if (page >= totalPages - 2) p = totalPages - 4 + i
                else p = page - 2 + i
              }
              return (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                    p === page
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="btn-icon disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

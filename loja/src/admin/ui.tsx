import type { ReactNode } from 'react'
import type { OrderStatus } from '../types'

export function Card({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-2xl text-navy">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-4xl text-navy">{children}</h1>
      {action}
    </div>
  )
}

export const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  nova: { label: 'Nova', cls: 'bg-teal-soft text-teal-deep' },
  confirmada: { label: 'Confirmada', cls: 'bg-[#E7EEF8] text-navy' },
  paga: { label: 'Paga', cls: 'bg-[#E6F4EC] text-[#167C47]' },
  enviada: { label: 'Enviada', cls: 'bg-sand text-[#7A5A33]' },
  entregue: { label: 'Entregue', cls: 'bg-[#E6F4EC] text-[#0F5C33]' },
  cancelada: { label: 'Cancelada', cls: 'bg-[#F7E6E2] text-danger' },
}

export function StatusPill({ s }: { s: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS[s].cls}`}>{STATUS[s].label}</span>
}

export function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div role="status" className="fixed bottom-24 left-1/2 z-50 w-max max-w-[90vw] -translate-x-1/2 rounded-full bg-navy px-5 py-3 text-center text-sm text-white shadow-xl md:bottom-6">
      {msg}
    </div>
  )
}

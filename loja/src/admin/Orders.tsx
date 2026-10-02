import { useState } from 'react'
import { api } from '../lib/api'
import { formatMZN, waLink } from '../lib/format'
import { useCatalog } from '../state/catalog'
import type { OrderStatus } from '../types'
import { PageTitle, STATUS, StatusPill, Toast } from './ui'
import { useOrders } from './useOrders'

const FLOW: OrderStatus[] = ['nova', 'confirmada', 'paga', 'enviada', 'entregue', 'cancelada']

export default function Orders() {
  const { orders, loading, error, reload } = useOrders()
  const { refresh } = useCatalog()
  const [filter, setFilter] = useState<OrderStatus | ''>('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  async function change(id: string, status: OrderStatus) {
    try {
      await api.setOrderStatus(id, status)
      await Promise.all([reload(), refresh()])
      setToast(status === 'cancelada' ? 'Encomenda cancelada. O stock foi reposto.' : `Estado alterado para ${STATUS[status].label}.`)
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Não foi possível alterar o estado.')
    }
    setTimeout(() => setToast(''), 2600)
  }

  const list = orders.filter((o) => !filter || o.status === filter)

  return (
    <>
      <PageTitle>Encomendas</PageTitle>
      <div className="mb-5 flex flex-wrap gap-2">
        {(['', ...FLOW] as const).map((s) => (
          <button
            key={s || 'todas'}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${filter === s ? 'border-navy bg-navy text-white' : 'border-line bg-white'}`}
          >
            {s ? STATUS[s].label : 'Todas'} <span className="opacity-60">({s ? orders.filter((o) => o.status === s).length : orders.length})</span>
          </button>
        ))}
      </div>
      {error && <p className="text-danger">{error}</p>}
      {!loading && list.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-muted">Sem encomendas neste estado.</p>}
      <ul className="grid gap-3">
        {list.map((o) => {
          const open = openId === o.id
          return (
            <li key={o.id} className="rounded-2xl border border-line bg-white">
              <button onClick={() => setOpenId(open ? null : o.id)} className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 p-4 text-left">
                <span className="font-display text-xl text-navy">nº {o.number}</span>
                <StatusPill s={o.status} />
                <span className="font-medium">{o.customer.name}</span>
                <span className="text-sm text-muted">{new Date(o.createdAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</span>
                <span className="num ml-auto text-sm font-semibold">
                  {o.items.reduce((a, i) => a + i.qty, 0)} pç · {o.total != null ? formatMZN(o.total) : 'preço a confirmar'}
                </span>
              </button>
              {open && (
                <div className="grid gap-6 border-t border-line p-4 md:grid-cols-[1.4fr_1fr]">
                  <div>
                    <table className="num w-full text-sm">
                      <tbody>
                        {o.items.map((i, k) => (
                          <tr key={k} className="border-b border-line last:border-0">
                            <td className="py-2">{i.qty}×</td>
                            <td className="py-2">{i.name}</td>
                            <td className="py-2 text-muted">{i.colorName}</td>
                            <td className="py-2 font-semibold">{i.size}</td>
                            <td className="py-2 text-right">{i.unitPrice != null ? formatMZN(i.unitPrice * i.qty) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {o.notes && <p className="mt-3 rounded-xl bg-mist p-3 text-sm">Notas: {o.notes}</p>}
                  </div>
                  <div className="grid gap-3 text-sm">
                    <p>
                      <b>{o.customer.name}</b>
                      <br />
                      <a className="text-teal-deep underline" href={waLink(o.customer.phone.startsWith('+') || o.customer.phone.startsWith('258') ? o.customer.phone : `258${o.customer.phone}`, `Olá ${o.customer.name.split(' ')[0]}! Sobre a sua encomenda nº ${o.number} na MEDIQUE:`)} target="_blank" rel="noopener noreferrer">
                        {o.customer.phone}
                      </a>
                      {o.customer.email && <><br />{o.customer.email}</>}
                    </p>
                    <p className="text-muted">
                      {[o.address.street, o.address.city, o.address.province].join(', ')}
                      {o.address.reference && <><br />Ref.: {o.address.reference}</>}
                    </p>
                    <label>
                      <span className="label">Estado</span>
                      <select className="field" value={o.status} onChange={(e) => change(o.id, e.target.value as OrderStatus)}>
                        {FLOW.map((s) => (
                          <option key={s} value={s}>
                            {STATUS[s].label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-xs text-muted">Cancelar devolve as peças ao stock. Reabrir uma cancelada volta a reservá-las.</p>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <Toast msg={toast} />
    </>
  )
}

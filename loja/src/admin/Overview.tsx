import { Link } from 'react-router-dom'
import { formatMZN } from '../lib/format'
import { pendingTotal, productTotal, qtyOf } from '../lib/stock'
import { useCatalog } from '../state/catalog'
import { Card, PageTitle, StatusPill } from './ui'
import { useOrders } from './useOrders'

export default function Overview() {
  const { products, color, settings } = useCatalog()
  const { orders } = useOrders()

  const units = products.reduce((a, p) => a + productTotal(p), 0)
  const pending = products.reduce((a, p) => a + pendingTotal(p), 0)
  const variants = products.flatMap((p) => p.colors.map((pc) => ({ p, pc })))
  const soldOutColors = variants.filter(({ pc }) => Object.values(pc.stock).every((n) => !n))
  const low = variants.flatMap(({ p, pc }) =>
    settings.sizes.filter((s) => qtyOf(pc, s) === 1).map((s) => ({ p, pc, s })),
  )
  const bySize = settings.sizes.map((s) => ({ s, n: variants.reduce((a, { pc }) => a + qtyOf(pc, s), 0) }))
  const maxSize = Math.max(1, ...bySize.map((b) => b.n))
  const active = orders.filter((o) => o.status !== 'cancelada')
  const revenue = orders.filter((o) => ['paga', 'enviada', 'entregue'].includes(o.status)).reduce((a, o) => a + (o.total ?? 0), 0)
  const unitsSold = active.reduce((a, o) => a + o.items.reduce((b, i) => b + i.qty, 0), 0)
  const missingPrice = products.filter((p) => p.price == null).length

  const kpis = [
    { label: 'Peças à venda', value: String(units), hint: pending ? `+${pending} reservada(s) por confirmar` : '' },
    { label: 'Encomendas novas', value: String(orders.filter((o) => o.status === 'nova').length), hint: `${orders.length} no total` },
    { label: 'Peças vendidas', value: String(unitsSold), hint: 'excluindo canceladas' },
    { label: 'Receita recebida', value: formatMZN(revenue), hint: 'pagas, enviadas e entregues' },
  ]

  return (
    <>
      <PageTitle>Resumo</PageTitle>
      {missingPrice > 0 && (
        <p className="mb-6 rounded-2xl bg-sand p-4 text-sm">
          {missingPrice} {missingPrice === 1 ? 'produto ainda não tem' : 'produtos ainda não têm'} preço. Os clientes veem “Preço sob
          consulta”. <Link to="/admin/produtos" className="font-semibold text-navy underline">Definir preços</Link>
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{k.label}</p>
            <p className="num mt-2 font-display text-4xl text-navy">{k.value}</p>
            {k.hint && <p className="mt-1 text-xs text-muted">{k.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Stock por tamanho">
          <div className="grid gap-3">
            {bySize.map(({ s, n }) => (
              <div key={s} className="grid grid-cols-[40px_1fr_32px] items-center gap-3 text-sm">
                <span className="font-semibold text-navy">{s}</span>
                <div className="h-3 rounded-full bg-mist">
                  <div className="h-3 rounded-full bg-teal" style={{ width: `${(n / maxSize) * 100}%` }} />
                </div>
                <span className="num text-right text-muted">{n}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Últimas encomendas" action={<Link to="/admin/encomendas" className="text-sm font-semibold text-teal-deep">Ver todas</Link>}>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">Ainda não há encomendas.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="font-semibold">nº {o.number}</span>
                  <span className="flex-1 truncate text-muted">{o.customer.name}</span>
                  <StatusPill s={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Esgotados">
          {soldOutColors.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma cor esgotada.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {soldOutColors.map(({ p, pc }) => (
                <li key={pc.id} className="flex items-center gap-2 rounded-full bg-mist px-3 py-1.5 text-sm">
                  <span className="size-3 rounded-full" style={{ background: color(pc.colorId)?.hex }} />
                  {color(pc.colorId)?.name} <span className="text-muted">· {p.name}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Última peça" action={<Link to="/admin/stock" className="text-sm font-semibold text-teal-deep">Atualizar stock</Link>}>
          {low.length === 0 ? (
            <p className="text-sm text-muted">Nenhum tamanho com apenas uma peça.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {low.map(({ pc, s }) => (
                <li key={pc.id + s} className="flex items-center gap-2 rounded-full bg-mist px-3 py-1.5 text-sm">
                  <span className="size-3 rounded-full" style={{ background: color(pc.colorId)?.hex }} />
                  {color(pc.colorId)?.name} · <b>{s}</b>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

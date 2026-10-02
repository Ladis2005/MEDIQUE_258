import { Link, useNavigate } from 'react-router-dom'
import { ProductVisual } from '../components/ProductVisual'
import { CATEGORIES } from '../data/seed'
import { priceLabel, uid } from '../lib/format'
import { productTotal } from '../lib/stock'
import { useCatalog } from '../state/catalog'
import { PageTitle } from './ui'

export default function Products() {
  const { products, color } = useCatalog()
  const navigate = useNavigate()
  return (
    <>
      <PageTitle action={<button onClick={() => navigate(`/admin/produtos/novo-${uid()}`)} className="btn-primary max-sm:w-full">Adicionar produto</button>}>
        Produtos
      </PageTitle>
      <ul className="grid gap-3 md:hidden">
        {products.map((p) => {
          const first = p.colors[0]
          return (
            <li key={p.id}>
              <Link to={`/admin/produtos/${p.id}`} className="flex gap-4 rounded-2xl border border-line bg-white p-3 active:bg-mist">
                <span className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-mist">
                  <ProductVisual pc={first} color={first ? color(first.colorId) : undefined} badge={false} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <b className="text-navy">{p.name}</b>
                  <span className={`num text-sm ${p.price == null ? 'font-semibold text-danger' : ''}`}>
                    {p.price == null ? 'Sem preço' : priceLabel(p.price)}
                  </span>
                  <span className="text-xs text-muted">
                    {productTotal(p)} em stock · {p.colors.length} {p.colors.length === 1 ? 'cor' : 'cores'}
                    {!p.active && ' · oculto'}
                  </span>
                </span>
                <span className="self-center text-xl text-muted">›</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-mist text-[11px] tracking-[0.14em] text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categorias</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Cores</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const first = p.colors[0]
              return (
                <tr key={p.id} className="border-t border-line hover:bg-mist/60">
                  <td className="px-4 py-3">
                    <Link to={`/admin/produtos/${p.id}`} className="flex items-center gap-3">
                      <span className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-mist">
                        <ProductVisual pc={first} color={first ? color(first.colorId) : undefined} badge={false} />
                      </span>
                      <span className="font-semibold text-navy">{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {p.categories.map((c) => CATEGORIES.find((x) => x.id === c)?.label).join(', ') || '—'}
                  </td>
                  <td className={`num px-4 py-3 ${p.price == null ? 'text-danger' : ''}`}>{p.price == null ? 'Sem preço' : priceLabel(p.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-1">
                      {p.colors.slice(0, 10).map((pc) => (
                        <span key={pc.id} className="size-4 rounded-full ring-2 ring-white" style={{ background: color(pc.colorId)?.swatch || color(pc.colorId)?.hex }} />
                      ))}
                      {p.colors.length > 10 && <span className="pl-2 text-xs text-muted">+{p.colors.length - 10}</span>}
                    </div>
                  </td>
                  <td className="num px-4 py-3 text-right font-semibold">{productTotal(p)}</td>
                  <td className="px-4 py-3">{p.active ? 'Visível' : <span className="text-muted">Oculto</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

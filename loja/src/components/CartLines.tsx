import { Link } from 'react-router-dom'
import { formatMZN, priceLabel } from '../lib/format'
import { useCart } from '../state/cart'
import { useCatalog } from '../state/catalog'
import { ProductVisual } from './ProductVisual'
import { QtyStepper } from './QtyStepper'

export function CartLines({ compact = false }: { compact?: boolean }) {
  const { lines, setQty, remove } = useCart()
  const { products, color } = useCatalog()

  return (
    <ul className="divide-y divide-line">
      {lines.map((l) => {
        const pc = products.find((p) => p.id === l.productId)?.colors.find((c) => c.id === l.productColorId)
        const over = l.qty > l.available
        return (
          <li key={l.key} className="flex gap-4 py-5">
            <Link
              to={`/produto/${l.slug}?cor=${pc?.colorId ?? ''}`}
              className={`shrink-0 overflow-hidden rounded-xl bg-mist ${compact ? 'h-28 w-22' : 'h-36 w-28'}`}
            >
              <ProductVisual pc={pc} color={pc ? color(pc.colorId) : undefined} badge={false} />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/produto/${l.slug}`} className="font-display text-xl leading-tight text-navy">
                  {l.name}
                </Link>
                <span className="num shrink-0 text-sm font-semibold">
                  {l.unitPrice != null ? formatMZN(l.unitPrice * l.qty) : priceLabel(null)}
                </span>
              </div>
              <p className="flex items-center gap-2 text-sm text-muted">
                <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: l.hex }} />
                {l.colorName} · Tamanho {l.size}
              </p>
              {over && (
                <p className="text-xs font-semibold text-danger">
                  {l.available === 0
                    ? 'Esgotou entretanto. Retire do carrinho para continuar.'
                    : `Só restam ${l.available}. Ajuste a quantidade.`}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-2">
                <QtyStepper small value={l.qty} max={Math.max(l.available, 1)} onChange={(v) => setQty(l.key, v)} />
                <button
                  onClick={() => remove(l.key)}
                  className="text-xs font-semibold tracking-[0.12em] text-muted uppercase underline-offset-4 hover:text-navy hover:underline"
                >
                  Remover
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

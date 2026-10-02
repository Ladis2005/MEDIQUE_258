import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { Swatch } from '../components/Swatch'
import { CATEGORIES } from '../data/seed'
import { listings } from '../lib/listing'
import { useSeo } from '../lib/seo'
import { colorTotal, qtyOf } from '../lib/stock'
import { useCatalog } from '../state/catalog'
import type { CategoryId } from '../types'

export default function Shop() {
  const { categoria } = useParams()
  const [params, setParams] = useSearchParams()
  const { visible, colors, settings, loading } = useCatalog()
  const cat = CATEGORIES.find((c) => c.id === categoria)
  const cor = params.get('cor') ?? ''
  const tam = params.get('tamanho') ?? ''

  useSeo(cat?.label ?? 'Loja', `${cat?.label ?? 'Todos os uniformes'} MEDIQUE com stock em tempo real.`)

  const inCat = visible.filter((p) => !cat || p.categories.includes(cat.id as CategoryId))
  const list = listings(inCat, { color: cor, size: tam })
  // Só oferece filtros que têm resultados nesta categoria.
  const colorOpts = colors.filter((c) => inCat.some((p) => p.colors.some((pc) => pc.colorId === c.id && colorTotal(pc) > 0)))
  const sizeOpts = settings.sizes.filter((s) => inCat.some((p) => p.colors.some((pc) => qtyOf(pc, s) > 0)))

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(params)
    if (!v || n.get(k) === v) n.delete(k)
    else n.set(k, v)
    setParams(n, { replace: true })
  }

  return (
    <div className="wrap pt-10 pb-24 md:pt-14">
      <p className="eyebrow">Loja</p>
      <h1 className="mt-3 font-display text-5xl text-navy md:text-6xl">{cat?.label ?? 'Todos os uniformes'}</h1>

      <nav className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Categorias">
        {[{ id: '', label: 'Todos os uniformes' }, ...CATEGORIES].map((c) => {
          const active = (categoria ?? '') === c.id
          return (
            <Link
              key={c.id}
              to={c.id ? `/loja/${c.id}` : '/loja'}
              className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition ${
                active ? 'border-navy bg-navy text-white' : 'border-line text-muted hover:border-navy hover:text-navy'
              }`}
            >
              {c.label}
            </Link>
          )
        })}
      </nav>

      {(colorOpts.length > 0 || sizeOpts.length > 0) && (
        <div className="mt-6 grid gap-4 border-y border-line py-5 md:grid-cols-[auto_1fr] md:items-center md:gap-x-8">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">Cor</span>
          <div className="-ml-1 flex flex-wrap gap-1">
            {colorOpts.map((c) => (
              <Swatch key={c.id} color={c} selected={cor === c.id} onSelect={() => set('cor', c.id)} />
            ))}
          </div>
          <span className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">Tamanho</span>
          <div className="flex flex-wrap gap-2">
            {sizeOpts.map((s) => (
              <button
                key={s}
                onClick={() => set('tamanho', s)}
                aria-pressed={tam === s}
                className={`min-w-12 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  tam === s ? 'border-navy bg-navy text-white' : 'border-line hover:border-navy'
                }`}
              >
                {s}
              </button>
            ))}
            {(cor || tam) && (
              <button onClick={() => setParams({}, { replace: true })} className="px-2 text-xs font-semibold text-teal-deep underline underline-offset-4">
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? null : list.length ? (
        <div className="mt-12 grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((l) => (
            <ProductCard key={l.product.id + l.colorId} product={l.product} colorId={l.colorId} fixedColor />
          ))}
        </div>
      ) : (
        <div className="mt-16 rounded-3xl bg-mist px-6 py-20 text-center">
          <p className="font-display text-3xl text-navy">{inCat.length ? 'Nada com estes filtros' : 'Em breve nesta categoria'}</p>
          <p className="mx-auto mt-3 max-w-sm text-muted">
            {inCat.length
              ? 'Experimente outra cor ou tamanho.'
              : 'Estamos a preparar novos modelos. Veja entretanto os uniformes disponíveis.'}
          </p>
          <Link to="/loja" onClick={() => setParams({})} className="btn-primary mt-8">
            Ver todos os uniformes
          </Link>
        </div>
      )}
    </div>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { RotateIcon, WhatsappIcon } from '../components/icons'
import { ProductVisual } from '../components/ProductVisual'
import { QtyStepper } from '../components/QtyStepper'
import { SizeTable } from '../components/SizeTable'
import { Swatch } from '../components/Swatch'
import { Zoomable } from '../components/Zoomable'
import { CATEGORIES } from '../data/seed'
import { copyText, formatMZN, pecas, priceLabel, waLink, waPrefills } from '../lib/format'
import { useSeo } from '../lib/seo'
import { colorTotal, qtyOf } from '../lib/stock'
import { useCart } from '../state/cart'
import { useCatalog } from '../state/catalog'
import NotFound from './NotFound'

const ModelViewer = lazy(() => import('../components/three/ModelViewer'))

type View = { kind: 'front' } | { kind: 'back' } | { kind: 'extra'; src: string } | { kind: '3d' }

export default function ProductPage() {
  const { slug = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const { bySlug, color, settings, loading } = useCatalog()
  const { add, inCart, setOpen } = useCart()
  const product = bySlug(slug)

  const initial = useMemo(() => {
    if (!product) return undefined
    const want = product.colors.find((c) => c.colorId === params.get('cor'))
    return want ?? product.colors.find((c) => colorTotal(c) > 0) ?? product.colors[0]
  }, [product, params])

  const [pcId, setPcId] = useState(initial?.id)
  const [size, setSize] = useState<string>()
  const [qty, setQty] = useState(1)
  const [view, setView] = useState<View>({ kind: 'front' })
  const [added, setAdded] = useState(false)
  const [waNote, setWaNote] = useState('')
  const [open, setOpenTab] = useState<string | null>('descricao')

  useEffect(() => setPcId(initial?.id), [initial?.id])

  const pc = product?.colors.find((c) => c.id === pcId)
  const col = pc ? color(pc.colorId) : undefined

  // Ao mudar de cor: escolhe automaticamente o tamanho se só houver um, e repõe a vista.
  useEffect(() => {
    if (!pc) return
    const avail = settings.sizes.filter((s) => qtyOf(pc, s) > 0)
    setSize((cur) => (cur && qtyOf(pc, cur) > 0 ? cur : avail.length === 1 ? avail[0] : undefined))
    setView((v) => (v.kind === 'extra' || (v.kind === 'back' && pc.images.front && !pc.images.back) ? { kind: 'front' } : v))
  }, [pc, settings.sizes])

  useSeo(product ? `${product.name}${col ? ` · ${col.name}` : ''}` : 'Produto', product?.description)

  if (!product) return loading ? <div className="min-h-[60vh]" /> : <NotFound />

  const stockHere = pc && size ? qtyOf(pc, size) : 0
  const already = pc && size ? inCart(pc.id, size) : 0
  const canAdd = Math.max(0, stockHere - already)
  const cat = CATEGORIES.find((c) => product.categories.includes(c.id))

  // Com fotografias reais, a vista "Costas" só aparece se houver foto das costas (nunca a ilustração).
  const hasPhoto = Boolean(pc?.images.front)
  const views: { v: View; label: string }[] = [
    { v: { kind: 'front' }, label: 'Frente' },
    ...(!hasPhoto || pc?.images.back ? [{ v: { kind: 'back' as const }, label: 'Costas' }] : []),
    ...(pc?.images.gallery ?? []).map((src, i) => ({ v: { kind: 'extra' as const, src }, label: `Detalhe ${i + 1}` })),
    ...(product.modelUrl ? [{ v: { kind: '3d' as const }, label: '360°' }] : []),
  ]
  const same = (a: View, b: View) => a.kind === b.kind && (a.kind !== 'extra' || (b.kind === 'extra' && a.src === b.src))

  function chooseColor(id: string) {
    setPcId(id)
    const c = product!.colors.find((x) => x.id === id)
    if (c) setParams({ cor: c.colorId }, { replace: true, preventScrollReset: true })
    setQty(1)
  }

  function addToCart() {
    if (!pc || !size || canAdd < 1) return
    add({ productId: product!.id, productColorId: pc.id, size, qty: Math.min(qty, canAdd) })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
    setOpen(true)
    setQty(1)
  }

  const waText = `Olá MEDIQUE! Quero comprar:\n\n• ${qty}× ${product.name} | ${col?.name ?? ''} | ${size ?? '(tamanho por escolher)'}${
    product.price != null ? ` | ${formatMZN(product.price * qty)}` : ''
  }\n\n${location.origin}/produto/${product.slug}?cor=${pc?.colorId ?? ''}`

  const stage = (v: View) => {
    if (v.kind === '3d' && product.modelUrl)
      return (
        <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted">A carregar 3D…</div>}>
          <ModelViewer url={product.modelUrl} hex={col?.hex ?? '#ffffff'} />
        </Suspense>
      )
    if (v.kind === 'extra')
      return (
        <Zoomable>
          <img src={v.src} alt={`${product.name} — detalhe`} className="h-full w-full object-cover" />
        </Zoomable>
      )
    return (
      <Zoomable>
        <ProductVisual pc={pc} color={col} view={v.kind === 'back' ? 'back' : 'front'} />
      </Zoomable>
    )
  }

  return (
    <div className="wrap pt-6 pb-24 md:pt-10">
      <nav className="mb-6 flex flex-wrap gap-2 text-xs text-muted" aria-label="Caminho">
        <Link to="/loja" className="hover:text-navy">Loja</Link>
        {cat && (
          <>
            <span>/</span>
            <Link to={`/loja/${cat.id}`} className="hover:text-navy">{cat.label}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        {/* Galeria */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-mist">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${pc?.id}-${view.kind}-${view.kind === 'extra' ? view.src : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0"
              >
                {stage(view)}
              </motion.div>
            </AnimatePresence>
            {view.kind === '3d' && (
              <span className="pointer-events-none absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-navy">
                <RotateIcon width={14} height={14} /> Arraste para rodar · role para aproximar
              </span>
            )}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Vistas do produto">
            {views.map(({ v, label }) => (
              <button
                key={label}
                role="tab"
                aria-selected={same(v, view)}
                onClick={() => setView(v)}
                className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-mist ring-offset-2 transition ${
                  same(v, view) ? 'ring-2 ring-navy' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {v.kind === '3d' ? (
                  <span className="grid h-full place-items-center text-xs font-bold text-navy">
                    <RotateIcon />
                    360°
                  </span>
                ) : v.kind === 'extra' ? (
                  <img src={v.src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ProductVisual pc={pc} color={col} view={v.kind === 'back' ? 'back' : 'front'} badge={false} />
                )}
                <span className="sr-only">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Informação e compra */}
        <div id="comprar" className="scroll-mt-28">
          {product.isNew && <p className="eyebrow">Novidade</p>}
          <h1 className="mt-2 font-display text-4xl leading-tight text-navy md:text-5xl">{product.name}</h1>
          <p className="num mt-3 text-xl font-semibold text-ink">{priceLabel(product.price)}</p>

          <div className="mt-8 border-t border-line pt-6">
            <p className="text-sm">
              <span className="text-muted">Cor:</span> <span className="font-semibold">{col?.name}</span>
            </p>
            <div className="-ml-1 mt-3 flex flex-wrap gap-1">
              {product.colors.map((c) => {
                const k = color(c.colorId)
                return k ? (
                  <Swatch
                    key={c.id}
                    color={k}
                    size="md"
                    selected={c.id === pcId}
                    disabled={colorTotal(c) === 0}
                    onSelect={() => chooseColor(c.id)}
                  />
                ) : null
              })}
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <span className="text-muted">Tamanho:</span> <span className="font-semibold">{size ?? 'escolha um tamanho'}</span>
              </p>
              <button onClick={() => setOpenTab('tamanhos')} className="text-xs font-semibold text-teal-deep underline underline-offset-4">
                Guia de tamanhos
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {settings.sizes.map((s) => {
                const n = qtyOf(pc, s)
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s)
                      setQty(1)
                    }}
                    disabled={n === 0}
                    aria-pressed={size === s}
                    title={n === 0 ? 'Esgotado' : `${pecas(n)} em stock`}
                    className={`relative h-12 min-w-14 rounded-xl border px-3 text-sm font-semibold transition ${
                      size === s
                        ? 'border-navy bg-navy text-white'
                        : n === 0
                          ? 'cursor-not-allowed border-line text-muted/50 line-through'
                          : 'border-line hover:border-navy'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            <p className={`mt-3 text-sm ${size && stockHere <= 2 ? 'text-danger' : 'text-teal-deep'} font-medium`} aria-live="polite">
              {!pc || colorTotal(pc) === 0
                ? 'Esta cor está esgotada.'
                : !size
                  ? `Disponível em ${settings.sizes.filter((s) => qtyOf(pc, s) > 0).join(', ')}.`
                  : stockHere === 1
                    ? 'Última peça em stock.'
                    : `${pecas(stockHere)} em stock.`}
              {already > 0 && <span className="text-muted"> · {already} já no carrinho</span>}
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QtyStepper value={qty} max={Math.max(1, canAdd)} onChange={setQty} />
            <button onClick={addToCart} disabled={!size || canAdd < 1} className="btn-primary h-12 flex-1 px-6">
              {added ? 'Adicionado ✓' : !size ? 'Escolha o tamanho' : canAdd < 1 ? 'Sem mais stock' : 'Adicionar ao carrinho'}
            </button>
          </div>
          {settings.whatsapp ? (
            <a
              href={waLink(settings.whatsapp, waText)}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!size}
              onClick={async () => {
                if (waPrefills(settings.whatsapp)) return
                setWaNote(
                  (await copyText(waText))
                    ? 'Mensagem copiada. Cole-a na conversa do WhatsApp que abriu.'
                    : 'Indique na conversa o produto, a cor e o tamanho que escolheu.',
                )
              }}
              className={`btn mt-3 h-12 w-full border border-[#1F9E5B] text-[#167C47] hover:bg-[#1F9E5B] hover:text-white ${!size ? 'pointer-events-none opacity-40' : ''}`}
            >
              <WhatsappIcon /> Comprar pelo WhatsApp
            </a>
          ) : null}
          {settings.whatsapp && waNote && <p className="mt-2 text-xs font-semibold text-teal-deep" aria-live="polite">{waNote}</p>}
          {!settings.whatsapp && (
            <p className="mt-3 text-xs text-muted">A compra direta pelo WhatsApp fica disponível quando a loja configurar o número.</p>
          )}

          <div className="mt-10 divide-y divide-line border-y border-line">
            {[
              { id: 'descricao', title: 'Descrição', body: <p className="leading-relaxed text-muted">{product.description}</p> },
              {
                id: 'tamanhos',
                title: 'Guia de tamanhos',
                body: (
                  <div className="grid gap-3">
                    <SizeTable highlight={size} />
                    <p className="text-xs text-muted">Medidas do corpo em cm, orientativas. Se ficar entre dois tamanhos, escolha o maior.</p>
                  </div>
                ),
              },
              {
                id: 'encomenda',
                title: 'Encomenda e entrega',
                body: (
                  <p className="leading-relaxed text-muted">
                    Depois de finalizar a encomenda, a MEDIQUE confirma consigo pelo WhatsApp o valor, a forma de pagamento e a entrega.
                    As peças ficam reservadas para si a partir desse momento.
                  </p>
                ),
              },
            ].map((t) => (
              <div key={t.id}>
                <button
                  className="flex w-full items-center justify-between py-5 text-left"
                  onClick={() => setOpenTab(open === t.id ? null : t.id)}
                  aria-expanded={open === t.id}
                >
                  <span className="font-display text-xl text-navy">{t.title}</span>
                  <span className={`text-xl text-muted transition ${open === t.id ? 'rotate-45' : ''}`}>+</span>
                </button>
                <AnimatePresence initial={false}>
                  {open === t.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6">{t.body}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

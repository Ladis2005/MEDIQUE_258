import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Garment } from '../components/Garment'
import { ArrowIcon } from '../components/icons'
import { ProductCard } from '../components/ProductCard'
import { ProductVisual } from '../components/ProductVisual'
import { CATEGORIES } from '../data/seed'
import { pecas } from '../lib/format'
import { listings } from '../lib/listing'
import { useSeo } from '../lib/seo'
import { colorTotal, sizesInStock } from '../lib/stock'
import { useCatalog } from '../state/catalog'

const HeroScene = lazy(() => import('../components/three/HeroScene'))

const ease = [0.22, 1, 0.36, 1] as const

// Fotografias da campanha (pasta public/produtos), mostradas em sequência no topo da página.
const CAMPAIGN = [
  { src: '/produtos/bege-frente-costas.jpg', alt: 'Profissional de saúde com o uniforme MEDIQUE bege, de frente e de costas', label: 'Bege' },
  { src: '/produtos/azul-royal-mulher.jpg', alt: 'Profissional de saúde com o uniforme MEDIQUE azul royal', label: 'Azul Royal' },
  { src: '/produtos/azul-royal-homem.jpg', alt: 'Profissional de saúde com o uniforme MEDIQUE azul royal', label: 'Azul Royal' },
  { src: '/produtos/rosa-frente.jpg', alt: 'Profissional de saúde com o uniforme MEDIQUE rosa', label: 'Rosa' },
  { src: '/produtos/petroleo-casal.jpg', alt: 'Dois profissionais de saúde com o uniforme MEDIQUE azul petróleo', label: 'Azul Petróleo' },
  { src: '/produtos/bordo-casal.jpg', alt: 'Dois profissionais de saúde com o uniforme MEDIQUE bordô', label: 'Bordô' },
]
const rise = (d = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay: d, ease },
})

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90])
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08])
  const { visible } = useCatalog()
  const [slide, setSlide] = useState(0)
  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setSlide((s) => (s + 1) % CAMPAIGN.length), 5500)
    return () => clearInterval(t)
  }, [reduce])
  const nColors = new Set(visible.flatMap((p) => p.colors.filter((pc) => colorTotal(pc) > 0).map((pc) => pc.colorId))).size

  return (
    <section ref={ref} className="relative overflow-hidden bg-gradient-to-b from-sand via-white to-white">
      {/* 3D só na metade da fotografia, para nunca tapar o texto; escondido no telemóvel. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-90 md:block">
        {!reduce && (
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        )}
      </div>
      <div className="wrap relative grid items-center gap-10 pt-10 pb-16 md:grid-cols-[1fr_1fr] md:pt-16 lg:min-h-[640px] lg:gap-16 lg:pb-24">
        <div className="order-2 md:order-1">
          <motion.p {...rise(0.05)} className="eyebrow">
            Moda médica · Moçambique
          </motion.p>
          <motion.h1
            {...rise(0.15)}
            className="mt-5 font-display text-[64px] leading-[0.9] font-medium tracking-[0.08em] text-navy sm:text-[88px] lg:text-[118px]"
          >
            MEDIQUE
          </motion.h1>
          <motion.p {...rise(0.28)} className="mt-5 font-display text-[28px] leading-tight text-ink italic sm:text-[34px]">
            Uniformes que cuidam de quem cuida.
          </motion.p>
          <motion.p {...rise(0.38)} className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Estilo, conforto e profissionalismo em cada detalhe.
          </motion.p>
          <motion.div {...rise(0.5)} className="mt-9 flex flex-wrap gap-3">
            <a href="#cores" className="btn-primary">
              Explorar coleção
            </a>
            <Link to="/loja" className="btn-outline">
              Comprar agora
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease }}
          className="relative order-1 mx-auto w-full max-w-[520px] md:order-2"
        >
          <div className="absolute -inset-4 -z-10 rounded-t-full bg-beige/60 blur-2xl" />
          <div className="relative aspect-[4/4.6] overflow-hidden rounded-t-full rounded-b-[28px] bg-beige shadow-[0_40px_80px_-40px_rgba(7,59,112,.45)]">
            <motion.div style={{ y, scale }} className="absolute inset-0">
              <AnimatePresence initial={false}>
                <motion.img
                  key={slide}
                  src={CAMPAIGN[slide].src}
                  alt={CAMPAIGN[slide].alt}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease }}
                  className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
                  fetchPriority={slide === 0 ? 'high' : 'auto'}
                />
              </AnimatePresence>
            </motion.div>
          </div>
          <div className="absolute -bottom-2 right-6 flex gap-2" role="tablist" aria-label="Fotografias da campanha">
            {CAMPAIGN.map((c, i) => (
              <button
                key={c.src}
                role="tab"
                aria-selected={i === slide}
                aria-label={`Fotografia ${i + 1}: ${c.label}`}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === slide ? 'w-8 bg-navy' : 'w-3 bg-navy/25 hover:bg-navy/50'}`}
              />
            ))}
          </div>
          <motion.div
            {...rise(0.8)}
            className="absolute -bottom-5 left-4 rounded-2xl bg-white/90 px-5 py-4 shadow-xl backdrop-blur sm:-left-8"
          >
            <p className="text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">Em stock</p>
            <p className="font-display text-2xl text-navy">{nColors} cores</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

const TILE_PHOTOS: Record<string, string> = {
  conjuntos: '/produtos/bege-frente-costas.jpg',
  novidades: '/produtos/azul-royal-mulher.jpg',
  feminino: '/produtos/azul-royal-mulher.jpg',
  masculino: '/produtos/azul-royal-homem.jpg',
}

const TILE_COLORS: Record<string, string> = {
  feminino: '#E0358C',
  masculino: '#2850B8',
  conjuntos: '#1B5E6B',
  novidades: '#EADCC4',
}

function Categories() {
  const { visible } = useCatalog()
  return (
    <section className="wrap py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Categorias</p>
          <h2 className="mt-3 font-display text-4xl text-navy md:text-5xl">Encontre o seu uniforme</h2>
        </div>
        <Link to="/loja" className="group inline-flex items-center gap-2 text-sm font-semibold text-navy">
          Todos os uniformes <ArrowIcon className="transition group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {CATEGORIES.map((c, i) => {
          const n = visible.filter((p) => p.categories.includes(c.id)).length
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08, ease }}
            >
              <Link to={`/loja/${c.id}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-mist">
                <div className="absolute inset-0 grid place-items-center transition duration-700 ease-soft group-hover:scale-105">
                  {n > 0 ? (
                    <img src={TILE_PHOTOS[c.id]} alt="" loading="lazy" className="h-full w-full object-cover object-[50%_30%]" />
                  ) : (
                    <Garment hex={TILE_COLORS[c.id]} className="h-[70%] w-auto" />
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/80 to-transparent p-4 pt-14 md:p-5">
                  <p className="font-display text-xl leading-tight text-navy md:text-2xl">{c.label}</p>
                  <p className="mt-1 text-xs text-muted">{n ? `${n} ${n === 1 ? 'modelo' : 'modelos'}` : 'Em breve'}</p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function DiscoverColor() {
  const { visible, colors, color, settings } = useCatalog()
  // Para cada cor da coleção, o primeiro produto que a tem.
  const entries = useMemo(
    () =>
      colors
        .map((c) => {
          const p = visible.find((x) => x.colors.some((pc) => pc.colorId === c.id))
          const pc = p?.colors.find((x) => x.colorId === c.id)
          return p && pc ? { c, p, pc } : null
        })
        .filter((e): e is NonNullable<typeof e> => e !== null),
    [colors, visible],
  )
  const [sel, setSel] = useState(0)
  const cur = entries[sel]
  if (!cur) return null
  const sizes = sizesInStock(cur.pc, settings.sizes)

  return (
    <section id="cores" className="scroll-mt-24 bg-mist py-20 md:py-28">
      <div className="wrap grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-white lg:sticky lg:top-28 lg:self-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={cur.c.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5, ease }}
              className="absolute inset-0"
            >
              <ProductVisual pc={cur.pc} color={color(cur.c.id)} />
            </motion.div>
          </AnimatePresence>
          <div className="absolute top-5 right-5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-navy backdrop-blur">
            {cur.c.name}
          </div>
        </div>

        <div>
          <p className="eyebrow">Coleção de cores</p>
          <h2 className="mt-3 font-display text-5xl tracking-wide text-navy md:text-6xl">DESCUBRA A SUA COR.</h2>
          <p className="mt-4 max-w-md text-muted">Toque numa cor para ver o uniforme e os tamanhos que temos em stock.</p>

          <ul className="mt-10 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
            {entries.map((e, i) => {
              const out = colorTotal(e.pc) === 0
              return (
                <li key={e.c.id}>
                  <button
                    onClick={() => setSel(i)}
                    aria-pressed={i === sel}
                    className={`group flex h-full w-full flex-col items-center gap-2.5 rounded-2xl border px-2 py-4 text-center transition duration-300 ${
                      i === sel ? 'border-navy bg-white shadow-sm' : 'border-transparent hover:bg-white'
                    }`}
                  >
                    <span
                      className={`block size-11 rounded-full shadow-[inset_0_0_0_1px_rgba(12,34,54,.12)] transition duration-300 group-hover:scale-110 ${out ? 'opacity-40' : ''}`}
                      style={{ background: e.c.swatch || e.c.hex }}
                    />
                    <span className="text-[11px] leading-tight font-medium text-ink">{e.c.name}</span>
                    {out && <span className="text-[10px] text-muted">Esgotado</span>}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-white p-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">Em stock nesta cor</p>
              <p className="mt-1 text-lg font-semibold text-navy">
                {sizes.length ? sizes.join(' · ') : 'Esgotado'}
                <span className="ml-2 text-sm font-normal text-muted">{sizes.length ? `(${pecas(colorTotal(cur.pc))})` : ''}</span>
              </p>
            </div>
            <Link to={`/produto/${cur.p.slug}?cor=${cur.c.id}`} className="btn-primary">
              Ver nesta cor
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Collection() {
  const { visible } = useCatalog()
  const items = listings(visible).slice(0, 8)
  if (!items.length) return null
  return (
    <section className="wrap py-20 md:py-28">
      <p className="eyebrow">A coleção</p>
      <h2 className="mt-3 font-display text-4xl text-navy md:text-5xl">Feitos para turnos longos</h2>
      <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((l) => (
          <ProductCard key={l.product.id + l.colorId} product={l.product} colorId={l.colorId} fixedColor />
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link to="/loja" className="btn-outline">
          Ver todos os uniformes
        </Link>
      </div>
    </section>
  )
}

function Statement() {
  return (
    <section className="bg-navy text-white">
      <div className="wrap grid gap-8 py-20 md:grid-cols-[1.4fr_1fr] md:items-end md:py-28">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease }}
          className="font-display text-4xl leading-[1.1] md:text-6xl"
        >
          Estilo, conforto e profissionalismo <em className="text-beige">em cada detalhe.</em>
        </motion.p>
        <div className="grid gap-5 md:justify-items-end">
          <p className="max-w-sm text-white/70 md:text-right">
            A MEDIQUE veste médicos, enfermeiros e equipas de saúde em Moçambique. Cuidamos de quem cuida.
          </p>
          <Link to="/sobre" className="btn-light">
            Sobre nós
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  useSeo('', 'MEDIQUE — uniformes médicos premium em Moçambique. Scrubs e conjuntos em 15 cores. Cuidamos de quem cuida.')
  return (
    <>
      <Hero />
      <Categories />
      <DiscoverColor />
      <Collection />
      <Statement />
    </>
  )
}

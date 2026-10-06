import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { priceLabel } from '../lib/format'
import { pixel } from '../lib/pixel'
import { colorsInStock, isSoldOut, qtyOf, sizesInStock } from '../lib/stock'
import { useCart } from '../state/cart'
import { useCatalog } from '../state/catalog'
import type { Product } from '../types'
import { ProductVisual } from './ProductVisual'
import { Swatch } from './Swatch'

interface Props {
  product: Product
  /** Cor a mostrar primeiro (ex.: vinda do filtro de cor). */
  colorId?: string
  /** Um cartão por cor: esconde a escolha de cores e mostra só esta. */
  fixedColor?: boolean
}

export function ProductCard({ product, colorId, fixedColor = false }: Props) {
  const { color, settings } = useCatalog()
  const { add, inCart, setOpen } = useCart()
  const navigate = useNavigate()
  const avail = colorsInStock(product)
  const [sel, setSel] = useState(() => avail.find((c) => c.colorId === colorId)?.id ?? avail[0]?.id)
  const [hover, setHover] = useState(false)
  const pc = product.colors.find((c) => c.id === sel)
  const col = pc ? color(pc.colorId) : undefined
  const sizes = pc ? sizesInStock(pc, settings.sizes) : []
  const soldOut = isSoldOut(product)
  const href = `/produto/${product.slug}${pc ? `?cor=${pc.colorId}` : ''}`

  function quickAdd() {
    // Um único tamanho disponível: adiciona logo. Vários: escolher na página do produto.
    if (pc && sizes.length === 1 && inCart(pc.id, sizes[0]) < qtyOf(pc, sizes[0])) {
      add({ productId: product.id, productColorId: pc.id, size: sizes[0], qty: 1 })
      pixel.addToCart({ id: pc.id, name: product.name, color: col?.name, size: sizes[0], price: product.price })
      setOpen(true)
    } else navigate(href + '#comprar')
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col"
    >
      <Link
        to={href}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-mist"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="absolute inset-0 transition duration-700 ease-soft group-hover:scale-[1.04]">
          <ProductVisual pc={pc} color={col} view={hover && pc?.images.back ? 'back' : 'front'} badge={false} />
          {!pc?.images.back && pc?.images.gallery?.[0] && (
            <img
              src={pc.images.gallery[0]}
              alt=""
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover object-[50%_35%] transition-opacity duration-500 ${hover ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
        </div>
        <div className="absolute top-3 left-3 flex gap-1.5">
          {product.isNew && (
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-navy uppercase">Novo</span>
          )}
          {soldOut && (
            <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-white uppercase">Esgotado</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[22px] leading-tight text-navy">
            <Link to={href}>{product.name}</Link>
          </h3>
          <span className="num shrink-0 pt-1 text-sm font-semibold text-ink">{priceLabel(product.price)}</span>
        </div>
        {col && <p className="text-sm text-muted">{col.name}</p>}
        {fixedColor && avail.length > 1 && <p className="text-xs text-muted">+{avail.length - 1} cores disponíveis</p>}
        {!fixedColor && avail.length > 1 && (
          <div className="-ml-1 flex flex-wrap gap-0.5" aria-label="Cores disponíveis">
            {avail.map((c) => {
              const k = color(c.colorId)
              return k ? <Swatch key={c.id} color={k} size="sm" selected={c.id === sel} onSelect={() => setSel(c.id)} /> : null
            })}
          </div>
        )}
        <p className="text-xs text-muted">
          {sizes.length ? (
            <>
              Em stock: <span className="font-semibold text-ink">{sizes.join(' · ')}</span>
            </>
          ) : (
            'Sem stock de momento'
          )}
        </p>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          <Link to={href} className="btn-outline px-3 py-3 text-[11px]">
            Ver produto
          </Link>
          <button onClick={quickAdd} disabled={soldOut} className="btn-primary px-3 py-3 text-[11px]">
            Adicionar
          </button>
        </div>
      </div>
    </motion.article>
  )
}

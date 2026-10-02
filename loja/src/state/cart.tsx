import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { qtyOf } from '../lib/stock'
import type { OrderItem } from '../types'
import { useCatalog } from './catalog'

export interface CartLine {
  productId: string
  productColorId: string
  size: string
  qty: number
}

export interface ResolvedLine extends CartLine {
  key: string
  name: string
  slug: string
  colorName: string
  hex: string
  image?: string | null
  unitPrice: number | null
  available: number
}

interface CartCtx {
  lines: ResolvedLine[]
  count: number
  /** null quando algum produto ainda não tem preço. */
  total: number | null
  open: boolean
  setOpen(v: boolean): void
  add(line: CartLine): number
  setQty(key: string, qty: number): void
  remove(key: string): void
  clear(): void
  inCart(productColorId: string, size: string): number
  toItems(): OrderItem[]
}

const KEY = 'medique:cart'
const Ctx = createContext<CartCtx | null>(null)
const keyOf = (l: CartLine) => `${l.productColorId}|${l.size}`

function load(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, color } = useCatalog()
  const [raw, setRaw] = useState<CartLine[]>(load)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(raw))
    } catch {
      /* armazenamento indisponível: o carrinho vive só nesta sessão */
    }
  }, [raw])

  const lines = useMemo<ResolvedLine[]>(() => {
    const out: ResolvedLine[] = []
    for (const l of raw) {
      const p = products.find((x) => x.id === l.productId)
      const pc = p?.colors.find((c) => c.id === l.productColorId)
      if (!p || !pc) continue
      const c = color(pc.colorId)
      out.push({
        ...l,
        key: keyOf(l),
        name: p.name,
        slug: p.slug,
        colorName: c?.name ?? '',
        hex: c?.hex ?? '#ccc',
        image: pc.images.front,
        unitPrice: p.price,
        available: qtyOf(pc, l.size),
      })
    }
    return out
  }, [raw, products, color])

  const inCart = useCallback(
    (productColorId: string, size: string) => raw.find((l) => l.productColorId === productColorId && l.size === size)?.qty ?? 0,
    [raw],
  )

  const value = useMemo<CartCtx>(() => {
    const total = lines.some((l) => l.unitPrice == null) ? null : lines.reduce((a, l) => a + l.unitPrice! * l.qty, 0)
    return {
      lines,
      count: lines.reduce((a, l) => a + l.qty, 0),
      total,
      open,
      setOpen,
      inCart,
      add(line) {
        const ok = Math.max(0, line.qty)
        setRaw((prev) => {
          const k = keyOf(line)
          const ex = prev.find((l) => keyOf(l) === k)
          return ex ? prev.map((l) => (keyOf(l) === k ? { ...l, qty: l.qty + ok } : l)) : [...prev, { ...line, qty: ok }]
        })
        return ok
      },
      setQty(key, qty) {
        setRaw((prev) => prev.map((l) => (keyOf(l) === key ? { ...l, qty: Math.max(1, qty) } : l)))
      },
      remove(key) {
        setRaw((prev) => prev.filter((l) => keyOf(l) !== key))
      },
      clear() {
        setRaw([])
      },
      toItems() {
        return lines.map((l) => ({
          productId: l.productId,
          productColorId: l.productColorId,
          name: l.name,
          colorName: l.colorName,
          size: l.size,
          qty: l.qty,
          unitPrice: l.unitPrice,
        }))
      },
    }
  }, [lines, open, inCart])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart fora do CartProvider')
  return c
}

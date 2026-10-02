import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SEED_CATALOG } from '../data/seed'
import { api } from '../lib/api'
import type { Catalog, Color, Product } from '../types'

interface CatalogCtx extends Catalog {
  loading: boolean
  error: string | null
  refresh(): Promise<void>
  color(id: string): Color | undefined
  bySlug(slug: string): Product | undefined
  /** Produtos visíveis na loja. */
  visible: Product[]
}

const Ctx = createContext<CatalogCtx | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Catalog>(SEED_CATALOG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setData(await api.getCatalog())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar a loja.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo<CatalogCtx>(() => {
    const colorMap = new Map(data.colors.map((c) => [c.id, c]))
    return {
      ...data,
      loading,
      error,
      refresh,
      color: (id) => colorMap.get(id),
      bySlug: (slug) => data.products.find((p) => p.slug === slug),
      visible: data.products.filter((p) => p.active),
    }
  }, [data, loading, error, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCatalog() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCatalog fora do CatalogProvider')
  return c
}

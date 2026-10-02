import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import { useCatalog } from '../state/catalog'
import type { Order } from '../types'

/** De quanto em quanto tempo o painel procura encomendas novas. */
const POLL_MS = 30_000

interface OrdersCtx {
  orders: Order[]
  loading: boolean
  error: string
  reload(): Promise<void>
  /** Encomendas que chegaram enquanto o painel estava aberto e ainda não foram vistas. */
  fresh: Order[]
  dismissFresh(): void
}

const Ctx = createContext<OrdersCtx | null>(null)

/** Dois toques curtos. Falha em silêncio se o navegador não deixar tocar som. */
function beep() {
  try {
    const ctx = new AudioContext()
    for (const [i, freq] of [880, 1175].entries()) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.connect(gain).connect(ctx.destination)
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
      osc.start(t)
      osc.stop(t + 0.17)
    }
    setTimeout(() => ctx.close(), 800)
  } catch {
    /* sem som */
  }
}

function announce(novos: Order[]) {
  beep()
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  for (const o of novos) {
    const pecas = o.items.reduce((a, i) => a + i.qty, 0)
    const n = new Notification(`Nova encomenda nº ${o.number}`, {
      body: `${o.customer.name} · ${pecas} ${pecas === 1 ? 'peça' : 'peças'}`,
      icon: '/logo.png',
      tag: o.id,
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  }
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { refresh } = useCatalog()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fresh, setFresh] = useState<Order[]>([])
  // Encomendas já conhecidas. null até à primeira leitura, para não avisar das que já existiam.
  const known = useRef<Set<string> | null>(null)

  const reload = useCallback(async () => {
    try {
      const list = await api.listOrders()
      if (known.current) {
        const novos = list.filter((o) => !known.current!.has(o.id))
        if (novos.length) {
          setFresh((f) => [...novos, ...f])
          announce(novos)
          refresh() // o stock desceu com a encomenda nova
        }
      }
      known.current = new Set(list.map((o) => o.id))
      setOrders(list)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar encomendas.')
    } finally {
      setLoading(false)
    }
  }, [refresh])

  useEffect(() => {
    reload()
    const t = setInterval(reload, POLL_MS)
    const onVisible = () => !document.hidden && reload()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  // Mostra o número de encomendas por tratar no título do separador do navegador.
  const novas = orders.filter((o) => o.status === 'nova').length
  useEffect(() => {
    const base = 'Painel · MEDIQUE'
    document.title = novas ? `(${novas}) ${base}` : base
  }, [novas, orders])

  return (
    <Ctx.Provider value={{ orders, loading, error, reload, fresh, dismissFresh: () => setFresh([]) }}>{children}</Ctx.Provider>
  )
}

export function useOrders() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useOrders fora do OrdersProvider')
  return c
}

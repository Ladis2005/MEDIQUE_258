import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import { useCatalog } from '../state/catalog'
import type { Order } from '../types'

/** De quanto em quanto tempo o painel procura encomendas novas (reserva, se o tempo real falhar). */
const POLL_MS = 20_000
/** Número da última encomenda que a equipa já viu neste navegador. */
const SEEN_KEY = 'medique:admin:seen'

function readSeen(): number | null {
  try {
    const v = localStorage.getItem(SEEN_KEY)
    return v == null ? null : Number(v)
  } catch {
    return null
  }
}
function writeSeen(n: number) {
  try {
    localStorage.setItem(SEEN_KEY, String(n))
  } catch {
    /* sem armazenamento: os avisos valem só para esta sessão */
  }
}

interface OrdersCtx {
  orders: Order[]
  loading: boolean
  error: string
  reload(): Promise<void>
  /** Encomendas ainda não vistas, incluindo as que chegaram com o painel fechado. */
  fresh: Order[]
  /** Marca todas as encomendas como vistas. */
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

/** Resumo das peças que saíram do stock, ex.: "2× Azul Royal S, 1× Preto M". */
export const itemsSummary = (o: Order) => o.items.map((i) => `${i.qty}× ${i.colorName} ${i.size}`).join(', ')

/** Regista o service worker do painel (necessário para avisos no telemóvel). */
export function registerAdminSw() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin' }).catch(() => {
    /* sem service worker: fica o aviso dentro da página e o som */
  })
}

/** Mostra a notificação do sistema. Nunca lança erro: um aviso falhado não pode parar o painel. */
async function notify(o: Order) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const title = `Nova venda · encomenda nº ${o.number}`
  const opts = { body: `${o.customer.name}: ${itemsSummary(o)}`, icon: '/logo.png', tag: o.id, data: { url: `/admin/encomendas?abrir=${o.id}` } }
  try {
    // Telemóvel (Android): só funciona através do service worker.
    const reg = await navigator.serviceWorker?.getRegistration('/admin')
    if (reg) return void (await reg.showNotification(title, opts))
  } catch {
    /* tenta da forma clássica */
  }
  try {
    const n = new Notification(title, opts)
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* navegador sem suporte: fica o aviso dentro da página */
  }
}

function announce(novos: Order[]) {
  beep()
  for (const o of novos) notify(o)
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { refresh } = useCatalog()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [seen, setSeen] = useState<number | null>(readSeen)
  // Encomendas já conhecidas nesta sessão. null até à primeira leitura.
  const known = useRef<Set<string> | null>(null)

  const reload = useCallback(async () => {
    try {
      const list = await api.listOrders()
      const top = Math.max(0, ...list.map((o) => o.number))
      if (known.current) {
        const novos = list.filter((o) => !known.current!.has(o.id))
        if (novos.length) {
          announce(novos)
          refresh() // o stock desceu com a encomenda nova
        }
      } else {
        const s = readSeen()
        if (s == null) {
          // Primeira abertura do painel neste navegador: começa a contar a partir daqui.
          writeSeen(top)
          setSeen(top)
        } else {
          // Vendas feitas enquanto o painel esteve fechado.
          const missed = list.filter((o) => o.number > s)
          if (missed.length) announce(missed)
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
    const unsubscribe = api.onNewOrder(reload)
    const t = setInterval(reload, POLL_MS)
    const onVisible = () => !document.hidden && reload()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      unsubscribe()
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  const fresh = useMemo(() => (seen == null ? [] : orders.filter((o) => o.number > seen)), [orders, seen])
  const dismissFresh = useCallback(() => {
    const top = Math.max(seen ?? 0, ...orders.map((o) => o.number))
    writeSeen(top)
    setSeen(top)
  }, [orders, seen])

  // Mostra o número de encomendas por tratar no título do separador do navegador.
  const novas = orders.filter((o) => o.status === 'nova').length
  useEffect(() => {
    const base = 'Painel · MEDIQUE'
    document.title = novas ? `(${novas}) ${base}` : base
  }, [novas, orders])

  return (
    <Ctx.Provider value={{ orders, loading, error, reload, fresh, dismissFresh }}>{children}</Ctx.Provider>
  )
}

export function useOrders() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useOrders fora do OrdersProvider')
  return c
}

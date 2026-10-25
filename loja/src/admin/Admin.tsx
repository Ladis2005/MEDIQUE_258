import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { api } from '../lib/api'
import { useSeo } from '../lib/seo'
import Colors from './Colors'
import Orders from './Orders'
import Overview from './Overview'
import ProductEditor from './ProductEditor'
import Products from './Products'
import SettingsPanel from './SettingsPanel'
import StockMatrix from './StockMatrix'
import { formatMZN } from '../lib/format'
import { enablePush, pushSupported } from '../lib/push'
import { itemsSummary, OrdersProvider, registerAdminSw, useOrders } from './useOrders'

const NAV = [
  { to: '/admin', label: 'Resumo', end: true },
  { to: '/admin/encomendas', label: 'Encomendas' },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/stock', label: 'Stock' },
  { to: '/admin/cores', label: 'Cores' },
  { to: '/admin/definicoes', label: 'Definições' },
]

function Login({ onOk }: { onOk(): void }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await api.signIn(email, pw)
      onOk()
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Não foi possível entrar.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="grid min-h-dvh place-items-center bg-mist px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        <img src="/logo.png" alt="" className="h-10 w-auto" />
        <h1 className="mt-6 font-display text-3xl text-navy">Painel MEDIQUE</h1>
        <p className="mt-1 text-sm text-muted">Área reservada à equipa.</p>
        <div className="mt-6 grid gap-4">
          {api.mode === 'supabase' && (
            <label>
              <span className="label">Email</span>
              <input className="field" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          )}
          <label>
            <span className="label">Palavra-passe</span>
            <input className="field" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          {err && <p className="text-sm text-danger">{err}</p>}
          <button className="btn-primary" disabled={busy}>
            {busy ? 'A entrar…' : 'Entrar'}
          </button>
        </div>
        {api.mode === 'local' && (
          <p className="mt-6 rounded-xl bg-sand p-3 text-xs leading-relaxed text-ink/80">
            Modo de demonstração: os dados ficam guardados só neste navegador. Ligue o Supabase para usar a loja com clientes reais.
          </p>
        )}
      </form>
    </div>
  )
}

export default function Admin() {
  useSeo('Painel')
  const [state, setState] = useState<'check' | 'out' | 'in'>('check')
  useEffect(() => {
    api.isAdmin().then((ok) => setState(ok ? 'in' : 'out'))
  }, [])

  useEffect(() => {
    document.getElementById('boot')?.remove()
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', 'noindex')
  }, [])

  if (state === 'check') return <div className="grid min-h-dvh place-items-center text-muted">A verificar acesso…</div>
  if (state === 'out') return <Login onOk={() => setState('in')} />

  return (
    <OrdersProvider>
      <Panel onSignOut={() => setState('out')} />
    </OrdersProvider>
  )
}

/** Pede autorização para avisos do navegador (aparecem mesmo com o painel noutro separador). */
function NotifyButton() {
  const supported = typeof Notification !== 'undefined'
  const [perm, setPerm] = useState(supported ? Notification.permission : 'denied')
  // Com push, os avisos chegam a este aparelho mesmo com o painel fechado.
  const [push, setPush] = useState(false)
  useEffect(() => {
    if (perm !== 'granted') return
    if (pushSupported()) enablePush().then(setPush)
    else registerAdminSw()
  }, [perm])
  if (!supported)
    return (
      <span className="hidden text-xs text-muted sm:inline" title="No iPhone, adicione o painel ao ecrã principal (Partilhar → Adicionar ao ecrã principal) para receber avisos">
        🔕 Sem avisos neste navegador
      </span>
    )
  if (perm === 'granted')
    return (
      <span
        className="text-xs font-semibold whitespace-nowrap text-teal-deep"
        title={push ? 'Este aparelho recebe avisos de venda mesmo com o painel fechado' : 'O painel avisa quando chega uma encomenda'}
      >
        🔔 {push ? 'Avisos ligados neste aparelho' : 'Avisos ligados'}
      </span>
    )
  if (perm === 'denied')
    return <span className="hidden text-xs text-muted sm:inline" title="Autorize as notificações deste site nas definições do navegador">🔕 Avisos bloqueados</span>
  return (
    <button onClick={async () => setPerm(await Notification.requestPermission())} className="rounded-full bg-teal px-3 py-2 text-xs font-semibold whitespace-nowrap text-white hover:bg-teal-deep">
      🔔 Ativar avisos
    </button>
  )
}

const ago = (iso: string) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  return new Date(iso).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'short' })
}

/** Sino com as últimas vendas: o que saiu do stock, para quem e quando. */
function Bell() {
  const { orders, fresh, dismissFresh } = useOrders()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const freshIds = new Set(fresh.map((o) => o.id))
  const recent = orders.slice(0, 10)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-10 place-items-center rounded-full text-lg hover:bg-mist"
        aria-label={fresh.length ? `Notificações, ${fresh.length} ${fresh.length === 1 ? 'venda nova' : 'vendas novas'}` : 'Notificações'}
        aria-expanded={open}
      >
        🔔
        {fresh.length > 0 && (
          <span className="num absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
            {fresh.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-line bg-white shadow-2xl max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:w-auto">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold text-navy">Vendas</p>
            {fresh.length > 0 && (
              <button onClick={dismissFresh} className="text-xs font-semibold text-teal-deep underline underline-offset-4">
                Marcar como vistas
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">Ainda não há vendas.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/admin/encomendas?abrir=${o.id}`}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 text-sm hover:bg-mist ${freshIds.has(o.id) ? 'bg-teal-soft/60' : ''}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-navy">
                        {freshIds.has(o.id) && <span className="mr-1.5 inline-block size-2 rounded-full bg-danger align-middle" />}
                        Venda nº {o.number}
                      </span>
                      <span className="shrink-0 text-xs text-muted">{ago(o.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-ink">{o.customer.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Saiu do stock: {itemsSummary(o)}
                      {o.total != null && ` · ${formatMZN(o.total)}`}
                      {o.status === 'cancelada' && ' · cancelada (stock reposto)'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/encomendas"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-3 text-center text-xs font-semibold text-navy hover:bg-mist"
          >
            Ver todas as encomendas
          </Link>
        </div>
      )}
    </div>
  )
}

function Panel({ onSignOut }: { onSignOut(): void }) {
  const { orders, fresh, dismissFresh } = useOrders()
  const novas = orders.filter((o) => o.status === 'nova').length

  return (
    <div className="min-h-dvh bg-mist">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
          <img src="/logo.png" alt="" className="h-8 w-auto" />
          <span className="hidden font-display text-xl tracking-[0.18em] text-navy sm:inline">PAINEL</span>
          {api.mode === 'local' && (
            <span className="hidden rounded-full bg-sand px-3 py-1 text-[11px] font-semibold text-ink/70 sm:inline">Modo local</span>
          )}
          <span className="ml-auto" />
          <NotifyButton />
          <Bell />
          <a href="/" target="_blank" className="text-sm whitespace-nowrap text-muted hover:text-navy">
            Ver loja ↗
          </a>
          <button
            className="text-sm font-semibold text-navy"
            onClick={async () => {
              await api.signOut()
              onSignOut()
            }}
          >
            Sair
          </button>
        </div>
        <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Painel">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
                  isActive ? 'border-teal text-navy' : 'border-transparent text-muted hover:text-navy'
                }`
              }
            >
              {n.label}
              {n.to === '/admin/encomendas' && novas > 0 && (
                <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white" aria-label={`${novas} por tratar`}>
                  {novas}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      {api.mode === 'local' && (
        <div className="mx-auto mt-4 max-w-[1400px] rounded-2xl border border-danger/30 bg-danger/5 px-5 py-4 text-sm text-ink max-sm:mx-4 sm:px-6">
          <p className="font-semibold text-danger">As vendas dos clientes não chegam a este painel.</p>
          <p className="mt-1 leading-relaxed text-ink/80">
            A loja está em modo local: cada encomenda fica guardada só no telemóvel ou computador do cliente que a fez. Para receber
            aqui as vendas e os avisos, ligue o Supabase e defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> na
            Vercel (Settings → Environment Variables) e publique de novo. Os passos estão no README.
          </p>
        </div>
      )}

      {fresh.length > 0 && (
        <div role="alert" className="sticky top-[105px] z-20 mx-auto mt-4 flex max-w-[1400px] flex-wrap items-center gap-3 rounded-2xl bg-navy px-5 py-4 text-white shadow-xl max-sm:mx-4 sm:px-6">
          <span className="text-xl">🔔</span>
          <p className="flex-1 text-sm">
            <b>{fresh.length === 1 ? 'Nova venda' : `${fresh.length} novas vendas`}:</b>{' '}
            {fresh.slice(0, 3).map((o) => `nº ${o.number} (${o.customer.name})${o.items.length ? ` — ${itemsSummary(o)}` : ''}`).join(' · ')}
            {fresh.length > 3 && '…'}
          </p>
          <Link to="/admin/encomendas" onClick={dismissFresh} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-navy">
            Ver encomendas
          </Link>
          <button onClick={dismissFresh} className="text-xs text-white/70 underline">
            Fechar
          </button>
        </div>
      )}

      <main className="mx-auto max-w-[1400px] px-4 pt-6 pb-28 sm:px-6 md:py-8">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="encomendas" element={<Orders />} />
          <Route path="produtos" element={<Products />} />
          <Route path="produtos/:id" element={<ProductEditor />} />
          <Route path="stock" element={<StockMatrix />} />
          <Route path="cores" element={<Colors />} />
          <Route path="definicoes" element={<SettingsPanel />} />
        </Routes>
      </main>
    </div>
  )
}

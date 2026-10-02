import { useEffect, useState, type FormEvent } from 'react'
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
import { OrdersProvider, useOrders } from './useOrders'

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
  if (!supported) return null
  if (perm === 'granted')
    return <span className="text-xs font-semibold whitespace-nowrap text-teal-deep" title="O painel avisa quando chega uma encomenda">🔔 Avisos ligados</span>
  if (perm === 'denied')
    return <span className="hidden text-xs text-muted sm:inline" title="Autorize as notificações deste site nas definições do navegador">🔕 Avisos bloqueados</span>
  return (
    <button onClick={async () => setPerm(await Notification.requestPermission())} className="rounded-full bg-teal px-3 py-2 text-xs font-semibold whitespace-nowrap text-white hover:bg-teal-deep">
      🔔 Ativar avisos
    </button>
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

      {fresh.length > 0 && (
        <div role="alert" className="sticky top-[105px] z-20 mx-auto mt-4 flex max-w-[1400px] flex-wrap items-center gap-3 rounded-2xl bg-navy px-5 py-4 text-white shadow-xl max-sm:mx-4 sm:px-6">
          <span className="text-xl">🔔</span>
          <p className="flex-1 text-sm">
            <b>{fresh.length === 1 ? 'Nova encomenda' : `${fresh.length} novas encomendas`}:</b>{' '}
            {fresh.slice(0, 3).map((o) => `nº ${o.number} (${o.customer.name})`).join(', ')}
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

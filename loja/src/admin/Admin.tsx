import { useEffect, useState, type FormEvent } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { api } from '../lib/api'
import { useSeo } from '../lib/seo'
import Colors from './Colors'
import Orders from './Orders'
import Overview from './Overview'
import ProductEditor from './ProductEditor'
import Products from './Products'
import SettingsPanel from './SettingsPanel'
import StockMatrix from './StockMatrix'

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
    <div className="min-h-dvh bg-mist">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
          <img src="/logo.png" alt="" className="h-8 w-auto" />
          <span className="font-display text-xl tracking-[0.18em] text-navy">PAINEL</span>
          {api.mode === 'local' && (
            <span className="hidden rounded-full bg-sand px-3 py-1 text-[11px] font-semibold text-ink/70 sm:inline">Modo local</span>
          )}
          <a href="/" target="_blank" className="ml-auto text-sm text-muted hover:text-navy">
            Ver loja ↗
          </a>
          <button
            className="text-sm font-semibold text-navy"
            onClick={async () => {
              await api.signOut()
              setState('out')
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
                `shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition ${
                  isActive ? 'border-teal text-navy' : 'border-transparent text-muted hover:text-navy'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
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

import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ProductVisual } from '../components/ProductVisual'
import { WhatsappIcon } from '../components/icons'
import { api, StockError } from '../lib/api'
import { formatMZN, PROVINCES } from '../lib/format'
import { pixel } from '../lib/pixel'
import { useSeo } from '../lib/seo'
import { useCart } from '../state/cart'
import { useCatalog } from '../state/catalog'
import type { Order } from '../types'

export const LAST_ORDER_KEY = 'medique:last-order'

const PHONE = /^(\+?258)?\s?8[2-7]\s?\d{3}\s?\d{4}$/

export default function Checkout() {
  useSeo('Finalizar encomenda')
  const cart = useCart()
  const { refresh, products, color } = useCatalog()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [f, setF] = useState({ name: '', phone: '', email: '', province: '', city: '', street: '', reference: '', notes: '' })
  const [touched, setTouched] = useState(false)

  const pixelItems = () =>
    cart.lines.map((l) => ({ id: l.productColorId, name: l.name, color: l.colorName, size: l.size, price: l.unitPrice, qty: l.qty }))
  // Pixel: o cliente chegou ao checkout (uma vez por visita à página).
  useEffect(() => {
    if (cart.lines.length) pixel.initiateCheckout(pixelItems())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (cart.lines.length === 0 && !busy) return <Navigate to="/carrinho" replace />

  const errs = {
    name: f.name.trim().length < 2 ? 'Indique o seu nome.' : '',
    phone: !PHONE.test(f.phone.trim()) ? 'Indique um número moçambicano, por exemplo 84 123 4567.' : '',
    email: f.email && !/^\S+@\S+\.\S+$/.test(f.email) ? 'Este email não parece válido.' : '',
    province: !f.province ? 'Escolha a província.' : '',
    city: !f.city.trim() ? 'Indique a cidade.' : '',
    street: !f.street.trim() ? 'Indique o bairro, a rua ou o local de entrega.' : '',
  }
  const valid = Object.values(errs).every((e) => !e)
  const blocked = cart.lines.some((l) => l.qty > l.available)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!valid || blocked) return
    setBusy(true)
    setError(null)
    const bought = pixelItems()
    try {
      const order: Order = await api.placeOrder({
        customer: { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() || undefined },
        address: { province: f.province, city: f.city.trim(), street: f.street.trim(), reference: f.reference.trim() || undefined },
        items: cart.toItems(),
        notes: f.notes.trim() || undefined,
      })
      pixel.purchase(order.id, bought, order.total)
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
      } catch {
        /* sem armazenamento: a página seguinte recebe a encomenda pelo estado da navegação */
      }
      cart.clear()
      await refresh()
      navigate(`/encomenda/${order.number}`, { state: order, replace: true })
    } catch (err) {
      await refresh()
      setError(
        err instanceof StockError
          ? `${err.message} Atualizámos o carrinho com o stock atual.`
          : 'Não foi possível registar a encomenda. Verifique a ligação e tente novamente.',
      )
      setBusy(false)
    }
  }

  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const err = touched ? (errs as Record<string, string>)[k] : ''
    return (
      <label className="block">
        <span className="label">{label}</span>
        <input
          className={`field ${err ? 'border-danger' : ''}`}
          value={f[k]}
          onChange={(e) => setF({ ...f, [k]: e.target.value })}
          aria-invalid={!!err}
          {...props}
        />
        {err && <span className="mt-1 block text-xs text-danger">{err}</span>}
      </label>
    )
  }

  return (
    <div className="wrap pt-10 pb-24 md:pt-14">
      <Link to="/carrinho" className="text-xs font-semibold tracking-[0.14em] text-muted uppercase hover:text-navy">
        ← Voltar ao carrinho
      </Link>
      <h1 className="mt-4 font-display text-5xl text-navy">Finalizar encomenda</h1>

      <form onSubmit={submit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-10">
          <fieldset className="grid gap-4">
            <legend className="mb-4 font-display text-2xl text-navy">Contacto</legend>
            {field('name', 'Nome completo', { autoComplete: 'name' })}
            <div className="grid gap-4 sm:grid-cols-2">
              {field('phone', 'Telefone / WhatsApp', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '84 123 4567' })}
              {field('email', 'Email (opcional)', { type: 'email', autoComplete: 'email' })}
            </div>
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="mb-4 font-display text-2xl text-navy">Entrega</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Província</span>
                <select
                  className={`field ${touched && errs.province ? 'border-danger' : ''}`}
                  value={f.province}
                  onChange={(e) => setF({ ...f, province: e.target.value })}
                >
                  <option value="">Escolha…</option>
                  {PROVINCES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                {touched && errs.province && <span className="mt-1 block text-xs text-danger">{errs.province}</span>}
              </label>
              {field('city', 'Cidade / distrito', { autoComplete: 'address-level2' })}
            </div>
            {field('street', 'Bairro, rua e número', { autoComplete: 'street-address' })}
            {field('reference', 'Ponto de referência (opcional)')}
            <label className="block">
              <span className="label">Notas para a MEDIQUE (opcional)</span>
              <textarea className="field min-h-24" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
            </label>
          </fieldset>
        </div>

        <aside className="h-fit rounded-3xl bg-mist p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl text-navy">Resumo da encomenda</h2>
          <ul className="mt-5 divide-y divide-line">
            {cart.lines.map((l) => {
              const pc = products.find((p) => p.id === l.productId)?.colors.find((c) => c.id === l.productColorId)
              return (
                <li key={l.key} className="flex gap-3 py-3">
                  <div className="h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-white">
                    <ProductVisual pc={pc} color={pc ? color(pc.colorId) : undefined} badge={false} />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-navy">{l.name}</p>
                    <p className="text-muted">
                      {l.colorName} · {l.size} · {l.qty}×
                    </p>
                    {l.qty > l.available && <p className="text-xs font-semibold text-danger">Só restam {l.available}</p>}
                  </div>
                  <span className="num text-sm font-semibold">{l.unitPrice != null ? formatMZN(l.unitPrice * l.qty) : '—'}</span>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex justify-between border-t border-line pt-4 font-semibold">
            <span>Total</span>
            <span className="num">{cart.total != null ? formatMZN(cart.total) : 'A confirmar'}</span>
          </div>
          {cart.total == null && <p className="mt-2 text-xs text-muted">Alguns preços são confirmados pela MEDIQUE antes do pagamento.</p>}

          {error && <p className="mt-5 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
          {blocked && !error && (
            <p className="mt-5 text-sm text-danger">
              Alguns artigos já não têm stock suficiente. <Link to="/carrinho" className="underline">Ajuste o carrinho</Link>.
            </p>
          )}

          <button type="submit" disabled={busy || blocked} className="btn mt-6 h-13 w-full bg-[#1F9E5B] text-white hover:bg-[#178A4D]">
            <WhatsappIcon /> {busy ? 'A registar…' : 'Finalizar pelo WhatsApp'}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            A encomenda fica registada e as peças reservadas. A seguir enviamos os detalhes para o WhatsApp da MEDIQUE, onde
            combinamos o pagamento e a entrega.
          </p>
        </aside>
      </form>
    </div>
  )
}

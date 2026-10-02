import { Link } from 'react-router-dom'
import { CartLines } from '../components/CartLines'
import { formatMZN, pecas } from '../lib/format'
import { useSeo } from '../lib/seo'
import { useCart } from '../state/cart'

export default function Cart() {
  useSeo('Carrinho')
  const { lines, count, total } = useCart()
  const blocked = lines.some((l) => l.qty > l.available)

  return (
    <div className="wrap pt-10 pb-24 md:pt-14">
      <h1 className="font-display text-5xl text-navy">Carrinho</h1>
      {lines.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-mist px-6 py-20 text-center">
          <p className="text-muted">O carrinho está vazio.</p>
          <Link to="/loja" className="btn-primary mt-6">
            Explorar coleção
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <CartLines />
          <aside className="h-fit rounded-3xl bg-mist p-6 lg:sticky lg:top-28">
            <h2 className="font-display text-2xl text-navy">Resumo</h2>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Artigos</dt>
                <dd className="num">{pecas(count)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="num">{total != null ? formatMZN(total) : 'A confirmar'}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">Valores em Meticais (MZN). A entrega é combinada consigo pelo WhatsApp.</p>
            <Link to="/checkout" className={`btn-primary mt-6 w-full ${blocked ? 'pointer-events-none opacity-40' : ''}`} aria-disabled={blocked}>
              Finalizar encomenda
            </Link>
            {blocked && <p className="mt-3 text-xs font-semibold text-danger">Ajuste as quantidades assinaladas para continuar.</p>}
          </aside>
        </div>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useSeo } from '../lib/seo'

export default function NotFound() {
  useSeo('Página não encontrada')
  return (
    <div className="wrap grid min-h-[60vh] place-content-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-5xl text-navy">Esta página não existe</h1>
      <p className="mt-3 text-muted">O endereço pode ter mudado ou o produto já não estar disponível.</p>
      <Link to="/loja" className="btn-primary mx-auto mt-8">
        Ir para a loja
      </Link>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { waLink } from '../lib/format'
import { useCatalog } from '../state/catalog'

export function Footer() {
  const { settings } = useCatalog()
  const social = [
    { label: 'Instagram', href: settings.instagram },
    { label: 'Facebook', href: settings.facebook },
    { label: 'TikTok', href: settings.tiktok },
    { label: 'X', href: settings.x },
    { label: 'WhatsApp', href: settings.whatsapp ? waLink(settings.whatsapp, 'Olá MEDIQUE!') : '' },
  ]
  const pages = [
    { label: 'Sobre nós', to: '/sobre' },
    { label: 'Loja', to: '/loja' },
    { label: 'Guia de tamanhos', to: '/guia-de-tamanhos' },
    { label: 'Contactos', to: '/contactos' },
  ]
  const legal = [
    { label: 'Política de privacidade', to: '/privacidade' },
    { label: 'Termos e condições', to: '/termos' },
  ]
  const head = 'mb-4 text-[11px] font-semibold tracking-[0.22em] text-teal uppercase'
  const link = 'text-sm text-white/75 transition hover:text-white'

  return (
    <footer className="mt-auto bg-navy-deep text-white">
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-20">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-white">
              <img src="/logo.png" alt="" className="h-7 w-auto" />
            </span>
            <span className="font-display text-2xl tracking-[0.2em]">MEDIQUE</span>
          </div>
          <p className="mt-6 font-display text-[28px] leading-tight text-white/90 italic">Cuidamos de quem cuida.</p>
        </div>
        <nav aria-label="Páginas">
          <p className={head}>Explorar</p>
          <ul className="grid gap-3">
            {pages.map((p) => (
              <li key={p.to}>
                <Link to={p.to} className={link}>
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Redes sociais">
          <p className={head}>Siga-nos</p>
          <ul className="grid gap-3">
            {social.map((s) => (
              <li key={s.label}>
                {s.href ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={link}>
                    {s.label}
                  </a>
                ) : (
                  <span className="text-sm text-white/35" title="Em breve">
                    {s.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Informação legal">
          <p className={head}>Informação</p>
          <ul className="grid gap-3">
            {legal.map((p) => (
              <li key={p.to}>
                <Link to={p.to} className={link}>
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-white/50">
          <span>MEDIQUE — Cuidamos de quem cuida.</span>
          <span>© {new Date().getFullYear()} MEDIQUE · Moçambique</span>
        </div>
      </div>
    </footer>
  )
}

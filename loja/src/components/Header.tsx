import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CATEGORIES } from '../data/seed'
import { useCart } from '../state/cart'
import { useCatalog } from '../state/catalog'
import { colorsInStock } from '../lib/stock'
import { BagIcon, CloseIcon, MenuIcon } from './icons'
import { Logo } from './Logo'

const NAV = [
  { to: '/loja', label: 'Loja' },
  ...CATEGORIES.map((c) => ({ to: `/loja/${c.id}`, label: c.label })),
]

export function Header() {
  const { count, setOpen } = useCart()
  const { visible } = useCatalog()
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setMenu(false), [pathname])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const nColors = new Set(visible.flatMap((p) => colorsInStock(p).map((c) => c.colorId))).size

  return (
    <>
      <div className="bg-navy text-center text-[11px] font-medium tracking-[0.18em] text-white/85 uppercase">
        <p className="wrap py-2">
          {nColors > 0 ? `${nColors} cores em stock · encomende pelo WhatsApp` : 'Cuidamos de quem cuida'}
        </p>
      </div>
      <header
        className={`sticky top-0 z-40 border-b transition duration-300 ${
          scrolled ? 'border-line bg-white/90 backdrop-blur-lg' : 'border-transparent bg-white'
        }`}
      >
        <div className="wrap flex h-16 items-center gap-4 lg:h-[76px]">
          <button className="-ml-2 p-2 lg:hidden" onClick={() => setMenu(true)} aria-label="Abrir menu">
            <MenuIcon />
          </button>
          <Logo className="max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2" />
          <nav className="ml-10 hidden gap-7 lg:flex" aria-label="Principal">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end
                className={({ isActive }) =>
                  `relative py-1 text-[13px] font-medium tracking-wide transition hover:text-navy ${
                    isActive ? 'text-navy after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-teal' : 'text-muted'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={() => setOpen(true)}
            className="relative ml-auto -mr-2 flex items-center gap-2 p-2 text-navy"
            aria-label={`Carrinho, ${count} ${count === 1 ? 'artigo' : 'artigos'}`}
          >
            <BagIcon width={22} height={22} />
            <span className="hidden text-[13px] font-medium sm:inline">Carrinho</span>
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="num absolute top-0.5 left-5 grid size-[18px] place-items-center rounded-full bg-teal text-[10px] font-bold text-white sm:static sm:size-5"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial="h" animate="v" exit="h">
            <motion.div
              className="absolute inset-0 bg-navy-deep/40 backdrop-blur-sm"
              variants={{ h: { opacity: 0 }, v: { opacity: 1 } }}
              onClick={() => setMenu(false)}
            />
            <motion.nav
              className="absolute inset-y-0 left-0 flex w-[min(86vw,360px)] flex-col bg-white px-6 pt-[max(env(safe-area-inset-top),20px)] pb-8"
              variants={{ h: { x: '-100%' }, v: { x: 0 } }}
              transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
              aria-label="Menu"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setMenu(false)} className="-mr-2 p-2" aria-label="Fechar menu">
                  <CloseIcon />
                </button>
              </div>
              <ul className="mt-10 grid gap-1">
                {NAV.map((n) => (
                  <li key={n.to}>
                    <Link to={n.to} className="block border-b border-line py-4 font-display text-2xl text-navy">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto grid gap-2 text-sm text-muted">
                <Link to="/guia-de-tamanhos">Guia de tamanhos</Link>
                <Link to="/contactos">Contactos</Link>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

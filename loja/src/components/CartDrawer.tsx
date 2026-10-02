import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatMZN, pecas } from '../lib/format'
import { useCart } from '../state/cart'
import { CloseIcon } from './icons'
import { CartLines } from './CartLines'

export function CartDrawer() {
  const { open, setOpen, lines, count, total } = useCart()
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname, setOpen])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial="h" animate="v" exit="h">
          <motion.div
            className="absolute inset-0 bg-navy-deep/40 backdrop-blur-sm"
            variants={{ h: { opacity: 0 }, v: { opacity: 1 } }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-label="Carrinho"
            className="absolute inset-y-0 right-0 flex w-[min(100vw,440px)] flex-col bg-white shadow-2xl"
            variants={{ h: { x: '100%' }, v: { x: 0 } }}
            transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 pt-[max(env(safe-area-inset-top),20px)] pb-5">
              <h2 className="font-display text-3xl text-navy">O seu carrinho</h2>
              <button onClick={() => setOpen(false)} className="-mr-2 p-2" aria-label="Fechar carrinho">
                <CloseIcon />
              </button>
            </div>
            {lines.length === 0 ? (
              <div className="grid flex-1 place-content-center gap-5 px-8 text-center">
                <p className="text-muted">Ainda não adicionou nenhum uniforme.</p>
                <Link to="/loja" className="btn-primary">
                  Explorar coleção
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6">
                  <CartLines compact />
                </div>
                <div className="grid gap-4 border-t border-line px-6 pt-5 pb-[max(env(safe-area-inset-bottom),24px)]">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">Subtotal · {pecas(count)}</span>
                    <span className="num font-semibold text-navy">{total != null ? formatMZN(total) : 'A confirmar'}</span>
                  </div>
                  {total == null && (
                    <p className="-mt-2 text-xs text-muted">Confirmamos o preço consigo pelo WhatsApp antes do pagamento.</p>
                  )}
                  <Link to="/checkout" className="btn-primary w-full">
                    Finalizar encomenda
                  </Link>
                  <Link to="/carrinho" className="text-center text-xs font-semibold tracking-[0.14em] text-muted uppercase hover:text-navy">
                    Ver carrinho completo
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

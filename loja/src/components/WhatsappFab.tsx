import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { waLink } from '../lib/format'
import { pixel } from '../lib/pixel'
import { useCart } from '../state/cart'
import { useCatalog } from '../state/catalog'
import { WhatsappIcon } from './icons'

/**
 * Botão flutuante para falar com a MEDIQUE pelo WhatsApp a partir de qualquer página.
 * Fica escondido onde já há um botão de WhatsApp em destaque (checkout e encomenda) e,
 * no telemóvel, na página do produto, que tem a sua própria barra de compra.
 */
export function WhatsappFab() {
  const { settings } = useCatalog()
  const { open } = useCart()
  const { pathname } = useLocation()
  if (!settings.whatsapp || open || pathname === '/checkout' || pathname.startsWith('/encomenda')) return null
  const onProduct = pathname.startsWith('/produto/')

  return (
    <motion.a
      href={waLink(settings.whatsapp, 'Olá MEDIQUE! Tenho uma pergunta sobre os uniformes.')}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => pixel.contact()}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 20 }}
      className={`group fixed right-4 bottom-[max(env(safe-area-inset-bottom),16px)] z-30 flex items-center gap-2 rounded-full bg-[#1F9E5B] p-3.5 text-white shadow-[0_12px_30px_-8px_rgba(23,124,71,.6)] transition hover:bg-[#178A4D] sm:right-6 sm:bottom-6 ${
        onProduct ? 'max-lg:hidden' : ''
      }`}
      aria-label="Falar connosco no WhatsApp"
    >
      <WhatsappIcon width={26} height={26} />
      <span className="hidden pr-1 text-sm font-semibold md:inline">Fale connosco</span>
    </motion.a>
  )
}

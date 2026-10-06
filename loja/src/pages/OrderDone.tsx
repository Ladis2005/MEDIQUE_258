import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { WhatsappIcon } from '../components/icons'
import { copyText, formatMZN, waPrefills } from '../lib/format'
import { orderMessage, whatsappPayment } from '../lib/payments'
import { pixel } from '../lib/pixel'
import { useSeo } from '../lib/seo'
import { useCatalog } from '../state/catalog'
import type { Order } from '../types'
import { LAST_ORDER_KEY } from './Checkout'

function stored(): Order | null {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || 'null')
  } catch {
    return null
  }
}

export default function OrderDone() {
  useSeo('Encomenda registada')
  const { number } = useParams()
  const { state } = useLocation()
  const { settings } = useCatalog()
  const [copied, setCopied] = useState('')
  const order: Order | null = (state as Order | null) ?? stored()

  if (!order || String(order.number) !== number)
    return (
      <div className="wrap py-24 text-center">
        <p className="font-display text-3xl text-navy">Encomenda nº {number}</p>
        <p className="mt-3 text-muted">Os detalhes desta encomenda já não estão disponíveis neste navegador.</p>
        <Link to="/loja" className="btn-primary mt-8">Voltar à loja</Link>
      </div>
    )

  const msg = orderMessage(order)
  const prefills = waPrefills(settings.whatsapp)
  const copy = async (afterOpen = false) =>
    setCopied(
      (await copyText(msg))
        ? afterOpen
          ? 'Mensagem copiada. Cole-a na conversa do WhatsApp que abriu e envie.'
          : 'Mensagem copiada.'
        : 'Não foi possível copiar. Selecione o texto acima e copie-o.',
    )

  return (
    <div className="wrap max-w-3xl pt-14 pb-24 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="mx-auto grid size-16 place-items-center rounded-full bg-teal text-3xl text-white"
      >
        ✓
      </motion.div>
      <p className="eyebrow mt-6">Encomenda nº {order.number}</p>
      <h1 className="mt-3 font-display text-5xl text-navy">Obrigado, {order.customer.name.split(' ')[0]}.</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        A sua encomenda está registada e as peças estão reservadas. Envie-a agora pelo WhatsApp para a MEDIQUE confirmar o pagamento
        e a entrega.
      </p>

      {settings.whatsapp && !prefills && (
        <p className="mx-auto mt-6 max-w-md rounded-2xl bg-teal-soft p-4 text-sm text-teal-deep">
          Ao carregar em <b>Enviar pelo WhatsApp</b>, copiamos a mensagem por si. Na conversa que abrir, cole-a (manter premido →
          Colar) e envie.
        </p>
      )}

      <div className="mt-10 rounded-3xl bg-mist p-6 text-left">
        <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-ink select-all">{msg}</pre>
        <div className="mt-2 border-t border-line pt-3 text-right text-sm font-semibold">
          Total: {order.total != null ? formatMZN(order.total) : 'a confirmar'}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {whatsappPayment.available(settings) ? (
          <a
            href={whatsappPayment.checkoutUrl(order, settings)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-[#1F9E5B] text-white hover:bg-[#178A4D]"
            onClick={() => {
              pixel.contact()
              if (!prefills) copy(true)
            }}
          >
            <WhatsappIcon /> Enviar pelo WhatsApp
          </a>
        ) : (
          <p className="w-full text-sm text-danger">
            A loja ainda não tem um número de WhatsApp configurado. Copie a mensagem e envie-a à MEDIQUE.
          </p>
        )}
        <button onClick={() => copy()} className="btn-outline">
          Copiar mensagem
        </button>
      </div>
      <p className="mt-3 text-sm text-teal-deep" aria-live="polite">{copied}</p>
      <Link to="/loja" className="mt-10 inline-block text-xs font-semibold tracking-[0.14em] text-muted uppercase hover:text-navy">
        Continuar a comprar
      </Link>
    </div>
  )
}

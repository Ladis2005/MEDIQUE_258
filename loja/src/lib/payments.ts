import type { Order, Settings } from '../types'
import { formatMZN, waLink } from './format'

/**
 * Ponto único para métodos de finalização da encomenda.
 * Hoje só existe o WhatsApp. Para ligar M-Pesa, e-Mola ou cartão no futuro,
 * acrescente aqui um novo PaymentMethod (que normalmente chama uma Edge Function
 * do Supabase) e mostre-o no checkout.
 */
export interface PaymentMethod {
  id: string
  label: string
  available(settings: Settings): boolean
  /** Devolve o URL para onde o cliente deve seguir depois de a encomenda ser criada. */
  checkoutUrl(order: Order, settings: Settings): string
}

export function orderMessage(o: Order) {
  const lines = o.items.map(
    (i) =>
      `• ${i.qty}× ${i.name} | ${i.colorName} | ${i.size}` +
      (i.unitPrice != null ? ` | ${formatMZN(i.unitPrice * i.qty)}` : ''),
  )
  const a = o.address
  return [
    `Olá MEDIQUE! Fiz a encomenda nº ${o.number} no site:`,
    '',
    ...lines,
    '',
    `Total: ${o.total != null ? formatMZN(o.total) : 'a confirmar'}`,
    '',
    `Nome: ${o.customer.name}`,
    `Telefone: ${o.customer.phone}`,
    ...(o.customer.email ? [`Email: ${o.customer.email}`] : []),
    `Entrega: ${[a.street, a.city, a.province].filter(Boolean).join(', ')}`,
    ...(a.reference ? [`Referência: ${a.reference}`] : []),
    ...(o.notes ? ['', `Notas: ${o.notes}`] : []),
  ].join('\n')
}

export const whatsappPayment: PaymentMethod = {
  id: 'whatsapp',
  label: 'Finalizar pelo WhatsApp',
  available: (s) => Boolean(s.whatsapp),
  checkoutUrl: (o, s) => waLink(s.whatsapp, orderMessage(o)),
}

export const PAYMENT_METHODS: PaymentMethod[] = [whatsappPayment]

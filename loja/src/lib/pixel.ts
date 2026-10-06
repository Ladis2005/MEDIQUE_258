/**
 * Pixel do Facebook (Meta).
 * Só é carregado se VITE_META_PIXEL_ID estiver definido, e nunca no painel de administração.
 * Para acrescentar outro pixel (TikTok, Google), siga o mesmo desenho: uma função por evento da loja.
 */
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown; callMethod?: (...a: unknown[]) => void }
declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

let started = false

function start() {
  if (started || !PIXEL_ID) return
  started = true
  // Carregador oficial do pixel, escrito em TypeScript.
  const fbq: Fbq = (...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue!.push(args)
  }
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)
  fbq('init', PIXEL_ID)
}

function track(event: string, params?: Record<string, unknown>, eventID?: string) {
  if (!PIXEL_ID) return
  start()
  window.fbq?.('track', event, params ?? {}, eventID ? { eventID } : undefined)
}

interface Item {
  id: string
  name: string
  color?: string
  size?: string
  price: number | null
  qty?: number
}

const content = (i: Item) => ({
  content_type: 'product',
  content_ids: [i.id],
  content_name: [i.name, i.color, i.size].filter(Boolean).join(' · '),
  contents: [{ id: i.id, quantity: i.qty ?? 1 }],
  currency: 'MZN',
  value: (i.price ?? 0) * (i.qty ?? 1),
})

export const pixel = {
  enabled: Boolean(PIXEL_ID),
  pageView: () => track('PageView'),
  viewContent: (i: Item) => track('ViewContent', content(i)),
  addToCart: (i: Item) => track('AddToCart', content(i)),
  initiateCheckout: (items: Item[]) =>
    track('InitiateCheckout', {
      content_type: 'product',
      content_ids: items.map((i) => i.id),
      contents: items.map((i) => ({ id: i.id, quantity: i.qty ?? 1 })),
      num_items: items.reduce((a, i) => a + (i.qty ?? 1), 0),
      currency: 'MZN',
      value: items.reduce((a, i) => a + (i.price ?? 0) * (i.qty ?? 1), 0),
    }),
  /** `orderId` evita contar a mesma encomenda duas vezes. */
  purchase: (orderId: string, items: Item[], total: number | null) =>
    track(
      'Purchase',
      {
        content_type: 'product',
        content_ids: items.map((i) => i.id),
        contents: items.map((i) => ({ id: i.id, quantity: i.qty ?? 1 })),
        num_items: items.reduce((a, i) => a + (i.qty ?? 1), 0),
        currency: 'MZN',
        value: total ?? items.reduce((a, i) => a + (i.price ?? 0) * (i.qty ?? 1), 0),
      },
      orderId,
    ),
  contact: () => track('Contact'),
}

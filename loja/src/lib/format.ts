const mzn = new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const formatMZN = (n: number) => `${mzn.format(n)} MT`

export const priceLabel = (n: number | null) => (n == null ? 'Preço sob consulta' : formatMZN(n))

export const pecas = (n: number) => `${n} ${n === 1 ? 'peça' : 'peças'}`

export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const uid = () => crypto.randomUUID()

/** Número de WhatsApp só com dígitos (ex.: 25884xxxxxxx). */
export const waDigits = (n: string) => n.replace(/\D/g, '')

/** O contacto foi indicado como link (ex.: wa.me/message/…) em vez de número de telefone. */
export const isWaUrl = (v: string) => /^https?:|wa\.me\/|whatsapp\.com\//i.test(v.trim())

/** Corrige links escritos à mão, como "https:/wa.me/…" ou "wa.me/…". */
export function normalizeUrl(v: string) {
  const t = v.trim().replace(/^https?:\/*/i, '')
  return `https://${t}`
}

/**
 * Só os números de telefone permitem preencher a mensagem automaticamente.
 * Os links curtos do WhatsApp Business (wa.me/message/…) abrem a conversa sem texto.
 */
export const waPrefills = (v: string) => !isWaUrl(v)

export const waLink = (contact: string, text: string) =>
  isWaUrl(contact) ? normalizeUrl(contact) : `https://wa.me/${waDigits(contact)}?text=${encodeURIComponent(text)}`

/** Copia o texto (dentro de um clique). Devolve false se o navegador não deixar. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export const PROVINCES = [
  'Maputo Cidade',
  'Maputo Província',
  'Gaza',
  'Inhambane',
  'Sofala',
  'Manica',
  'Tete',
  'Zambézia',
  'Nampula',
  'Cabo Delgado',
  'Niassa',
]

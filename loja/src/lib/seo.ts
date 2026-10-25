import { useEffect } from 'react'

const SUFFIX = 'MEDIQUE'
const DEFAULT_TITLE = `${SUFFIX} · Uniformes médicos em Moçambique`

/** Endereço público da loja (VITE_SITE_URL no .env); sem ele, usa o endereço atual. */
export const siteUrl = () => (import.meta.env.VITE_SITE_URL || location.origin).replace(/\/$/, '')

/** Torna absoluto um caminho como "/produtos/x.jpg" (o Facebook e o Google precisam de endereços completos). */
export const absUrl = (path: string) => (/^https?:/.test(path) ? path : siteUrl() + path)

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = value
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

interface SeoExtra {
  /** Imagem para partilhas (WhatsApp, Facebook). */
  image?: string | null
  /** Dados estruturados schema.org para o Google (produto, loja). */
  jsonLd?: object | null
}

/** Título, descrição, partilha nas redes e dados para o Google, por página (SEO numa SPA). */
export function useSeo(title: string, description?: string, extra: SeoExtra = {}) {
  const { image, jsonLd } = extra
  const ld = jsonLd ? JSON.stringify(jsonLd) : ''
  useEffect(() => {
    const full = title ? `${title} · ${SUFFIX}` : DEFAULT_TITLE
    document.title = full
    setMeta('property', 'og:title', full)
    if (description) {
      setMeta('name', 'description', description)
      setMeta('property', 'og:description', description)
    }
    const url = siteUrl() + location.pathname
    setMeta('property', 'og:url', url)
    setCanonical(url)
    setMeta('property', 'og:image', absUrl(image || '/og.jpg'))
  }, [title, description, image])

  useEffect(() => {
    if (!ld) return
    const s = document.createElement('script')
    s.type = 'application/ld+json'
    s.textContent = ld
    document.head.appendChild(s)
    return () => s.remove()
  }, [ld])
}

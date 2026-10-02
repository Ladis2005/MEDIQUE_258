import { useEffect } from 'react'

const SUFFIX = 'MEDIQUE'

/** Título e descrição por página (SEO básico numa SPA). */
export function useSeo(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : `${SUFFIX} · Uniformes médicos em Moçambique`
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    }
  }, [title, description])
}

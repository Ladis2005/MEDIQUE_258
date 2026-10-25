/**
 * Fotografias da pasta public/produtos têm versões WebP de 600 e 1200 px (geradas com `npm run images`).
 * Devolve os atributos para o navegador escolher a versão certa para o ecrã.
 * Fotografias carregadas no painel (Supabase) ficam como estão.
 */
export function responsive(src: string, sizes = '(min-width: 1024px) 33vw, 50vw') {
  const m = src.match(/^\/produtos\/([^/]+)\.(jpe?g|png)$/i)
  if (!m) return { src }
  return {
    src: `/produtos/1200/${m[1]}.webp`,
    srcSet: `/produtos/600/${m[1]}.webp 600w, /produtos/1200/${m[1]}.webp 1200w`,
    sizes,
  }
}

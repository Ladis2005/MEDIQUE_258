import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * SEO no momento da publicação:
 * - com VITE_SITE_URL, as etiquetas de partilha do index.html passam a endereços completos
 *   (o WhatsApp e o Facebook não leem endereços relativos) e é criado o sitemap.xml;
 * - sem VITE_SITE_URL, nada muda e aparece um aviso.
 */
function seo(site: string): Plugin {
  // Ao criar produtos ou categorias novas (src/data/seed.ts), acrescente aqui os endereços.
  const pages = [
    '/',
    '/loja',
    '/loja/feminino',
    '/loja/masculino',
    '/loja/conjuntos',
    '/loja/novidades',
    '/produto/conjunto-scrub-medique',
    '/sobre',
    '/guia-de-tamanhos',
    '/contactos',
  ]
  return {
    name: 'medique-seo',
    transformIndexHtml(html) {
      if (!site) return html
      return html
        .replace('content="/og.jpg"', `content="${site}/og.jpg"`)
        .replace('</head>', `  <meta property="og:url" content="${site}/" />\n    <link rel="canonical" href="${site}/" />\n  </head>`)
    },
    generateBundle() {
      if (!site) {
        this.warn('VITE_SITE_URL não definido: sem sitemap.xml e com imagem de partilha relativa.')
        return
      }
      const urls = pages.map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nDisallow: /admin\n\nSitemap: ${site}/sitemap.xml\n` })
    },
  }
}

export default defineConfig(({ mode }) => {
  const site = (loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL || '').replace(/\/$/, '')
  return {
    plugins: [react(), tailwindcss(), seo(site)],
    // O 3D (three.js) e o painel são carregados só quando são precisos (imports dinâmicos).
    build: { chunkSizeWarningLimit: 1100 },
  }
})

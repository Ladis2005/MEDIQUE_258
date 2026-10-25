// Gera versões WebP mais leves das fotografias de public/produtos (600 e 1200 px de largura).
// Corra depois de acrescentar fotografias novas a essa pasta: npm run images
import { mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const DIR = 'public/produtos'
const WIDTHS = [600, 1200]

for (const w of WIDTHS) mkdirSync(join(DIR, String(w)), { recursive: true })

for (const file of readdirSync(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
  const src = join(DIR, file)
  for (const w of WIDTHS) {
    const out = join(DIR, String(w), file.replace(/\.\w+$/, '.webp'))
    try {
      if (statSync(out).mtimeMs > statSync(src).mtimeMs) continue
    } catch {
      /* ainda não existe */
    }
    await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out)
  }
  console.log('✓', file)
}

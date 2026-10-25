import type { Color, ProductColor } from '../types'
import { responsive } from '../lib/image'
import { Garment } from './Garment'

interface Props {
  pc?: ProductColor
  color?: Color
  view?: 'front' | 'back'
  className?: string
  /** Mostra a etiqueta "Ilustração" quando não há fotografia. */
  badge?: boolean
  sizes?: string
  /** Imagem principal da página: carrega logo, com prioridade. */
  eager?: boolean
}

/** Fotografia real da peça quando existe; caso contrário, a ilustração provisória na cor certa. */
export function ProductVisual({ pc, color, view = 'front', className = '', badge = true, sizes, eager = false }: Props) {
  const src = view === 'front' ? pc?.images.front : pc?.images.back
  if (src)
    return (
      <img
        {...responsive(src, sizes)}
        alt={`Uniforme MEDIQUE ${color?.name ?? ''} — ${view === 'front' ? 'frente' : 'costas'}`}
        className={`h-full w-full object-cover object-[50%_35%] ${className}`}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
      />
    )
  return (
    <div className={`relative grid h-full w-full place-items-center ${className}`}>
      <Garment hex={color?.hex ?? '#ccc'} camo={!!color?.swatch} view={view} className="h-[82%] w-auto drop-shadow-sm" />
      {badge && (
        <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase backdrop-blur">
          Ilustração · foto em breve
        </span>
      )}
    </div>
  )
}

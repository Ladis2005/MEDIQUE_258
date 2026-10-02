import { useId } from 'react'

/** Luminância aproximada (0–255) para decidir contornos em cores claras. */
export function luminance(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace('#', ''), 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)))
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}

interface Props {
  hex: string
  camo?: boolean
  view?: 'front' | 'back'
  className?: string
}

/**
 * Ilustração provisória de um conjunto (blusa + calça), usada enquanto não há
 * fotografia real da peça. Mostra apenas a silhueta e a cor, sem inventar detalhes.
 */
export function Garment({ hex, camo, view = 'front', className }: Props) {
  const id = useId().replace(/:/g, '')
  const light = luminance(hex) > 200
  const stroke = light ? '#C9D2DA' : 'none'
  const top = 'M120 30 L150 78 L180 30 L215 42 L255 108 L229 121 L208 98 L210 200 L90 200 L92 98 L71 121 L45 108 L85 42 Z'
  const topBack = 'M120 30 Q150 44 180 30 L215 42 L255 108 L229 121 L208 98 L210 200 L90 200 L92 98 L71 121 L45 108 L85 42 Z'
  const pants = 'M98 196 H202 L210 388 H156 L150 252 L144 388 H90 Z'
  const fill = camo ? `url(#camo-${id})` : hex
  return (
    <svg viewBox="0 0 300 410" className={className} role="img" aria-label="Ilustração do uniforme">
      <defs>
        <linearGradient id={`sh-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".22" />
          <stop offset=".35" stopColor="#fff" stopOpacity=".07" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".1" />
          <stop offset="1" stopColor="#000" stopOpacity=".24" />
        </linearGradient>
        <linearGradient id={`v-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#000" stopOpacity=".12" />
        </linearGradient>
        {camo && (
          <pattern id={`camo-${id}`} width="90" height="90" patternUnits="userSpaceOnUse">
            <rect width="90" height="90" fill="#6B7440" />
            <path d="M10 14c14-10 30 2 26 14s-22 14-30 6-8-14 4-20z" fill="#4F5D2F" />
            <path d="M52 40c16-6 30 6 22 18s-28 10-30 0 0-14 8-18z" fill="#2F3A1E" />
            <path d="M58 6c8-4 20 0 18 8s-14 8-18 4-4-10 0-12z" fill="#8A8F5A" />
            <path d="M14 60c10-6 24 0 20 10s-18 12-22 6-6-12 2-16z" fill="#8A8F5A" />
          </pattern>
        )}
      </defs>
      <ellipse cx="150" cy="396" rx="78" ry="8" fill="#0c2236" opacity=".08" />
      <g>
        <path d={pants} fill={fill} stroke={stroke} strokeWidth="1.5" />
        <path d={pants} fill={`url(#sh-${id})`} />
        <path d={pants} fill={`url(#v-${id})`} />
        <path d="M150 252 L150 214" stroke={shade(hex, -0.12)} strokeWidth="1.5" opacity=".6" />
      </g>
      <g>
        <path d={view === 'front' ? top : topBack} fill={fill} stroke={stroke} strokeWidth="1.5" />
        <path d={view === 'front' ? top : topBack} fill={`url(#sh-${id})`} />
        <path d={view === 'front' ? top : topBack} fill={`url(#v-${id})`} />
        {view === 'front' ? (
          <path d="M120 30 L150 78 L180 30" fill="none" stroke={shade(hex, -0.16)} strokeWidth="5" strokeLinejoin="round" />
        ) : (
          <path d="M120 30 Q150 44 180 30" fill="none" stroke={shade(hex, -0.16)} strokeWidth="5" />
        )}
        <path d="M92 98 L94 196 M208 98 L206 196" stroke="#000" strokeOpacity=".08" strokeWidth="2" />
      </g>
    </svg>
  )
}

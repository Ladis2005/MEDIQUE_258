import type { Color } from '../types'
import { luminance } from './Garment'

interface Props {
  color: Color
  selected?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  onSelect?(): void
}

const SIZE = { sm: 'size-5', md: 'size-8', lg: 'size-11' }

export function Swatch({ color, selected, disabled, size = 'md', onSelect }: Props) {
  const ring = luminance(color.hex) > 200 ? 'shadow-[inset_0_0_0_1px_rgba(12,34,54,.18)]' : ''
  const dot = <span className={`block rounded-full ${SIZE[size]} ${ring}`} style={{ background: color.swatch || color.hex }} />
  if (!onSelect) return <span title={color.name}>{dot}</span>
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      title={disabled ? `${color.name} — esgotado` : color.name}
      aria-label={color.name}
      aria-pressed={selected}
      className={`relative rounded-full p-[3px] transition duration-300 ease-soft ${
        selected ? 'ring-2 ring-navy' : 'ring-1 ring-transparent hover:ring-line'
      } ${disabled ? 'cursor-not-allowed opacity-35' : 'hover:scale-110'}`}
    >
      {dot}
      {disabled && <span className="absolute inset-0 m-auto h-px w-[70%] rotate-45 bg-ink/50" />}
    </button>
  )
}

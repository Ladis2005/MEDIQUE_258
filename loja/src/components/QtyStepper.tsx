import { MinusIcon, PlusIcon } from './icons'

interface Props {
  value: number
  max: number
  onChange(v: number): void
  small?: boolean
}

export function QtyStepper({ value, max, onChange, small }: Props) {
  const h = small ? 'h-9' : 'h-12'
  return (
    <div className={`inline-flex ${h} items-center rounded-full border border-line`}>
      <button
        type="button"
        className="grid h-full w-10 place-items-center text-navy disabled:opacity-30"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Diminuir quantidade"
      >
        <MinusIcon width={16} />
      </button>
      <span className="num w-8 text-center text-sm font-semibold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="grid h-full w-10 place-items-center text-navy disabled:opacity-30"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
      >
        <PlusIcon width={16} />
      </button>
    </div>
  )
}

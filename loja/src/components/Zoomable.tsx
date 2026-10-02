import { useRef, useState, type ReactNode } from 'react'
import { ZoomIcon } from './icons'

/**
 * Aproximação para ver bolsos, gola e costuras.
 * Rato: passa por cima para ampliar seguindo o cursor. Toque: toca para ampliar e arrasta para mover.
 */
export function Zoomable({ children, scale = 2.4 }: { children: ReactNode; scale?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')

  const move = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100))
    setOrigin(`${x}% ${y}%`)
  }

  return (
    <div
      ref={ref}
      className={`relative h-full w-full overflow-hidden ${on ? 'cursor-zoom-out touch-none' : 'cursor-zoom-in'}`}
      onPointerMove={(e) => (on || e.pointerType === 'mouse') && move(e)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOn(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setOn(false)}
      onClick={(e) => {
        if ((e.nativeEvent as PointerEvent).pointerType === 'mouse') return
        move(e as unknown as React.PointerEvent)
        setOn((v) => !v)
      }}
    >
      <div
        className="h-full w-full transition-transform duration-300 ease-soft"
        style={{ transform: on ? `scale(${scale})` : 'scale(1)', transformOrigin: origin }}
      >
        {children}
      </div>
      {!on && (
        <span className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-navy shadow-sm backdrop-blur">
          <ZoomIcon width={14} height={14} /> <span className="hidden sm:inline">Passe o rato para ampliar</span>
          <span className="sm:hidden">Toque para ampliar</span>
        </span>
      )}
    </div>
  )
}

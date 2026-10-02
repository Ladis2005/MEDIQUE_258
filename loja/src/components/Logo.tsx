import { Link } from 'react-router-dom'

export function Logo({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`} aria-label="MEDIQUE — página inicial">
      <img src="/logo.png" alt="" width={36} height={34} className="h-8 w-auto sm:h-9" />
      <span className={`font-display text-[22px] font-semibold tracking-[0.2em] ${light ? 'text-white' : 'text-navy'}`}>
        MEDIQUE
      </span>
    </Link>
  )
}

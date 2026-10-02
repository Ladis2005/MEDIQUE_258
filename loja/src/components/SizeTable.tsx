/** Medidas orientativas do corpo (cm). Ajuste aqui se a MEDIQUE tiver uma tabela própria do fornecedor. */
export const MEASURES = [
  { size: 'XS', chest: '80–86', waist: '62–68', hip: '86–92' },
  { size: 'S', chest: '86–92', waist: '68–74', hip: '92–98' },
  { size: 'M', chest: '92–100', waist: '74–82', hip: '98–104' },
  { size: 'L', chest: '100–108', waist: '82–90', hip: '104–110' },
  { size: 'XL', chest: '108–116', waist: '90–100', hip: '110–118' },
  { size: 'XXL', chest: '116–126', waist: '100–110', hip: '118–126' },
]

export function SizeTable({ highlight }: { highlight?: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="num w-full min-w-[420px] text-left text-sm">
        <thead className="bg-mist text-[11px] tracking-[0.16em] text-muted uppercase">
          <tr>
            <th className="px-4 py-3 font-semibold">Tamanho</th>
            <th className="px-4 py-3 font-semibold">Peito</th>
            <th className="px-4 py-3 font-semibold">Cintura</th>
            <th className="px-4 py-3 font-semibold">Anca</th>
          </tr>
        </thead>
        <tbody>
          {MEASURES.map((m) => (
            <tr key={m.size} className={`border-t border-line ${highlight === m.size ? 'bg-teal-soft' : ''}`}>
              <td className="px-4 py-3 font-bold text-navy">{m.size}</td>
              <td className="px-4 py-3">{m.chest}</td>
              <td className="px-4 py-3">{m.waist}</td>
              <td className="px-4 py-3">{m.hip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

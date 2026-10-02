import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { colorTotal, qtyOf } from '../lib/stock'
import { useCatalog } from '../state/catalog'
import type { Product } from '../types'
import { PageTitle, Toast } from './ui'

/** Vista rápida para atualizar o stock de todos os produtos de uma vez. */
export default function StockMatrix() {
  const { products, color, settings, refresh } = useCatalog()
  const [draft, setDraft] = useState<Product[]>(products)
  const [onlyOut, setOnlyOut] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => setDraft(products), [products])

  const dirty = useMemo(() => draft.filter((d) => JSON.stringify(d) !== JSON.stringify(products.find((p) => p.id === d.id))), [draft, products])

  const set = (pid: string, pcId: string, size: string, v: number) =>
    setDraft((ds) =>
      ds.map((p) =>
        p.id !== pid
          ? p
          : {
              ...p,
              colors: p.colors.map((c) =>
                c.id !== pcId ? c : size === '__pending' ? { ...c, pending: v } : { ...c, stock: { ...c.stock, [size]: v } },
              ),
            },
      ),
    )

  async function save() {
    setBusy(true)
    try {
      for (const p of dirty) await api.saveProduct(p)
      await refresh()
      setToast('Stock atualizado.')
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Não foi possível guardar.')
    } finally {
      setBusy(false)
      setTimeout(() => setToast(''), 2400)
    }
  }

  const totals = settings.sizes.map((s) => draft.reduce((a, p) => a + p.colors.reduce((b, c) => b + qtyOf(c, s), 0), 0))
  const pendingAll = draft.reduce((a, p) => a + p.colors.reduce((b, c) => b + c.pending, 0), 0)

  return (
    <>
      <PageTitle
        action={
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyOut} onChange={(e) => setOnlyOut(e.target.checked)} /> Só esgotados
            </label>
            <button onClick={save} disabled={!dirty.length || busy} className="btn-primary px-5 py-2.5">
              {busy ? 'A guardar…' : dirty.length ? 'Guardar alterações' : 'Sem alterações'}
            </button>
          </div>
        }
      >
        Stock
      </PageTitle>
      {draft.map((p) => {
        const rows = p.colors.filter((c) => !onlyOut || colorTotal(c) === 0)
        if (!rows.length) return null
        return (
          <section key={p.id} className="mb-8">
            <h2 className="mb-3 font-display text-2xl text-navy">{p.name}</h2>
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="num w-full min-w-[720px] text-sm">
                <thead className="bg-mist text-[11px] tracking-[0.14em] text-muted uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Cor</th>
                    {settings.sizes.map((s) => (
                      <th key={s} className="px-2 py-3">{s}</th>
                    ))}
                    <th className="px-2 py-3" title="Reservadas no inventário interno, não vendidas no site">A confirmar</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((pc) => {
                    const c = color(pc.colorId)
                    const t = colorTotal(pc)
                    return (
                      <tr key={pc.id} className="border-t border-line">
                        <td className="px-4 py-2">
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            <span className="size-4 rounded-full ring-1 ring-black/10" style={{ background: c?.swatch || c?.hex }} />
                            {c?.name}
                          </span>
                        </td>
                        {settings.sizes.map((s) => (
                          <td key={s} className="px-1 py-1.5 text-center">
                            <input
                              aria-label={`${c?.name} ${s}`}
                              type="number"
                              min="0"
                              inputMode="numeric"
                              className={`w-14 rounded-lg border px-1 py-1.5 text-center ${qtyOf(pc, s) ? 'border-line font-semibold' : 'border-transparent bg-mist text-muted'}`}
                              value={qtyOf(pc, s)}
                              onChange={(e) => set(p.id, pc.id, s, Math.max(0, parseInt(e.target.value) || 0))}
                            />
                          </td>
                        ))}
                        <td className="px-1 py-1.5 text-center">
                          <input
                            aria-label={`${c?.name} a confirmar`}
                            type="number"
                            min="0"
                            className="w-14 rounded-lg border border-transparent bg-sand px-1 py-1.5 text-center"
                            value={pc.pending}
                            onChange={(e) => set(p.id, pc.id, '__pending', Math.max(0, parseInt(e.target.value) || 0))}
                          />
                        </td>
                        <td className={`px-4 py-2 text-right font-bold ${t ? 'text-navy' : 'text-danger'}`}>{t || 'Esgotado'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
      {!onlyOut && (
        <div className="num flex flex-wrap gap-x-6 gap-y-2 rounded-2xl bg-navy px-5 py-4 text-sm text-white">
          {settings.sizes.map((s, i) => (
            <span key={s}>
              {s}: <b>{totals[i]}</b>
            </span>
          ))}
          <span>A confirmar: <b>{pendingAll}</b></span>
          <span className="ml-auto">
            Total geral: <b className="text-base">{totals.reduce((a, b) => a + b, 0) + pendingAll}</b>
          </span>
        </div>
      )}
      <Toast msg={toast} />
    </>
  )
}

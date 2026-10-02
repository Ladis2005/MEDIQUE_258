import { useState } from 'react'
import { api } from '../lib/api'
import { slugify } from '../lib/format'
import { useCatalog } from '../state/catalog'
import type { Color } from '../types'
import { Card, PageTitle, Toast } from './ui'

export default function Colors() {
  const { colors, products, refresh } = useCatalog()
  const [name, setName] = useState('')
  const [hex, setHex] = useState('#159FA8')
  const [toast, setToast] = useState('')
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2600)
  }

  async function add() {
    const id = slugify(name)
    if (!id) return flash('Indique o nome da cor.')
    if (colors.some((c) => c.id === id)) return flash('Já existe uma cor com este nome.')
    await api.saveColor({ id, name: name.trim(), hex, sort: colors.length })
    await refresh()
    setName('')
    flash('Cor adicionada. Associe-a a um produto para a pôr à venda.')
  }

  async function update(c: Color) {
    await api.saveColor(c)
    await refresh()
  }

  async function remove(c: Color) {
    try {
      await api.deleteColor(c.id)
      await refresh()
      flash('Cor apagada.')
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Não foi possível apagar.')
    }
  }

  return (
    <>
      <PageTitle>Cores</PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card title="Nova cor" className="h-fit">
          <div className="grid gap-4">
            <label>
              <span className="label">Nome</span>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Lilás" />
            </label>
            <label>
              <span className="label">Tom (para amostras e ilustrações)</span>
              <span className="flex items-center gap-3">
                <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-line" />
                <input className="field num uppercase" value={hex} onChange={(e) => setHex(e.target.value)} />
              </span>
            </label>
            <button onClick={add} className="btn-primary">Adicionar cor</button>
          </div>
        </Card>
        <Card title={`Coleção (${colors.length})`}>
          <ul className="divide-y divide-line">
            {colors.map((c) => {
              const used = products.some((p) => p.colors.some((pc) => pc.colorId === c.id))
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                  <input
                    type="color"
                    aria-label={`Tom de ${c.name}`}
                    value={c.hex}
                    onChange={(e) => update({ ...c, hex: e.target.value })}
                    className="size-9 cursor-pointer rounded-full border-0 bg-transparent"
                    style={c.swatch ? { background: c.swatch, borderRadius: 999 } : undefined}
                  />
                  <input
                    className="field max-w-xs flex-1 py-2"
                    defaultValue={c.name}
                    onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && update({ ...c, name: e.target.value.trim() })}
                  />
                  <span className="text-xs text-muted">{used ? 'Em uso' : 'Sem produtos'}</span>
                  {!used && (
                    <button onClick={() => remove(c)} className="ml-auto text-xs text-danger underline">Apagar</button>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
      <Toast msg={toast} />
    </>
  )
}

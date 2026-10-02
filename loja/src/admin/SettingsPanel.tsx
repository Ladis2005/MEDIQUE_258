import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useCatalog } from '../state/catalog'
import type { Settings } from '../types'
import { Card, PageTitle, Toast } from './ui'

export default function SettingsPanel() {
  const { settings, products, refresh } = useCatalog()
  const [s, setS] = useState<Settings>(settings)
  const [newSize, setNewSize] = useState('')
  const [toast, setToast] = useState('')
  useEffect(() => setS(settings), [settings])

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2600)
  }

  async function save(next = s) {
    await api.saveSettings(next)
    await refresh()
    flash('Definições guardadas.')
  }

  const sizeInUse = (size: string) => products.some((p) => p.colors.some((pc) => (pc.stock[size] ?? 0) > 0))
  const move = (i: number, d: number) => {
    const arr = [...s.sizes]
    const j = i + d
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setS({ ...s, sizes: arr })
  }

  const text = (k: 'whatsapp' | 'instagram' | 'facebook' | 'x' | 'tiktok' | 'email', label: string, hint: string, ph: string) => (
    <label>
      <span className="label">{label}</span>
      <input className="field" value={s[k]} placeholder={ph} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      <span className="mt-1 block text-xs text-muted">{hint}</span>
    </label>
  )

  return (
    <>
      <PageTitle action={<button onClick={() => save()} className="btn-primary px-5 py-2.5">Guardar</button>}>Definições</PageTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Contactos e redes">
          <div className="grid gap-4">
            {text(
              'whatsapp',
              'WhatsApp da loja',
              'Número com indicativo (ex.: 258 84 000 0000) ou link wa.me. Com o número, a mensagem da encomenda já vai escrita; com o link, o site copia a mensagem e o cliente cola-a na conversa.',
              '258 84 000 0000',
            )}
            {text('email', 'Email', 'Aparece na página de contactos.', 'geral@…')}
            {text('instagram', 'Instagram (link)', 'Endereço completo do perfil.', 'https://instagram.com/…')}
            {text('facebook', 'Facebook (link)', 'Endereço completo da página.', 'https://facebook.com/…')}
            {text('tiktok', 'TikTok (link)', 'Endereço completo do perfil.', 'https://www.tiktok.com/@…')}
            {text('x', 'X / Twitter (link)', 'Endereço completo do perfil.', 'https://x.com/…')}
            <p className="text-xs text-muted">Campos vazios aparecem como “Em breve” no site. Não mostramos contactos que não indicar aqui.</p>
          </div>
        </Card>

        <Card title="Tamanhos">
          <p className="mb-4 text-sm text-muted">Ordem em que os tamanhos aparecem na loja e no stock.</p>
          <ul className="grid gap-2">
            {s.sizes.map((size, i) => (
              <li key={size} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                <b className="w-14 text-navy">{size}</b>
                <button className="px-2 text-muted disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
                <button className="px-2 text-muted disabled:opacity-30" disabled={i === s.sizes.length - 1} onClick={() => move(i, 1)} aria-label="Descer">↓</button>
                {sizeInUse(size) ? (
                  <span className="ml-auto text-xs text-muted">Com stock</span>
                ) : (
                  <button className="ml-auto text-xs text-danger underline" onClick={() => setS({ ...s, sizes: s.sizes.filter((x) => x !== size) })}>
                    Retirar
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input className="field" placeholder="Ex.: XXXL" value={newSize} onChange={(e) => setNewSize(e.target.value.toUpperCase())} />
            <button
              className="btn-outline px-4 py-2"
              onClick={() => {
                const v = newSize.trim()
                if (v && !s.sizes.includes(v)) setS({ ...s, sizes: [...s.sizes, v] })
                setNewSize('')
              }}
            >
              Adicionar
            </button>
          </div>
        </Card>

        <Card title="Ligação à base de dados" className="lg:col-span-2">
          {api.mode === 'supabase' ? (
            <p className="text-sm text-muted">A loja está ligada ao Supabase. Encomendas, stock e fotografias ficam guardados na nuvem.</p>
          ) : (
            <p className="text-sm leading-relaxed text-muted">
              <b className="text-danger">Modo local.</b> Tudo o que alterar aqui fica guardado só neste navegador, e as encomendas de
              clientes noutros dispositivos não aparecem. Para receber clientes reais, crie um projeto Supabase e siga o ficheiro
              <code className="mx-1 rounded bg-mist px-1.5 py-0.5">README.md</code>da pasta <code className="rounded bg-mist px-1.5 py-0.5">loja</code>.
            </p>
          )}
        </Card>
      </div>
      <Toast msg={toast} />
    </>
  )
}

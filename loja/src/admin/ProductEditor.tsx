import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductVisual } from '../components/ProductVisual'
import { CATEGORIES } from '../data/seed'
import { api } from '../lib/api'
import { slugify, uid } from '../lib/format'
import { useCatalog } from '../state/catalog'
import type { CategoryId, Product, ProductColor } from '../types'
import { Card, PageTitle, Toast } from './ui'

function blank(id: string): Product {
  return {
    id,
    slug: '',
    name: '',
    description: '',
    categories: [],
    price: null,
    isNew: true,
    active: true,
    modelUrl: null,
    colors: [],
    createdAt: new Date().toISOString(),
  }
}

function Upload({ label, accept, onFile, busy }: { label: string; accept: string; onFile(f: File): void; busy?: boolean }) {
  return (
    <label className={`inline-flex cursor-pointer items-center rounded-full border border-dashed border-navy/40 px-3.5 py-2.5 text-xs sm:py-1.5 font-semibold text-navy hover:bg-mist ${busy ? 'pointer-events-none opacity-50' : ''}`}>
      {busy ? 'A carregar…' : label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </label>
  )
}

export default function ProductEditor() {
  const { id = '' } = useParams()
  const isNew = id.startsWith('novo-')
  const { products, colors, color, settings, refresh } = useCatalog()
  const navigate = useNavigate()
  const existing = products.find((p) => p.id === id)
  const [p, setP] = useState<Product>(() => existing ?? blank(isNew ? id.slice(5) : id))
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (existing) setP(existing)
  }, [existing])

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2400)
  }
  const setColor = (pcId: string, patch: Partial<ProductColor>) =>
    setP((x) => ({ ...x, colors: x.colors.map((c) => (c.id === pcId ? { ...c, ...patch } : c)) }))

  async function upload(key: string, file: File, folder: 'produtos' | 'modelos') {
    setBusy(key)
    try {
      return await api.uploadFile(file, folder)
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Falha no carregamento.')
    } finally {
      setBusy(null)
    }
  }

  async function save() {
    const slug = p.slug || slugify(p.name)
    if (!p.name.trim()) return setErr('Indique o nome do produto.')
    if (products.some((x) => x.slug === slug && x.id !== p.id)) return setErr('Já existe um produto com este endereço (slug).')
    setErr('')
    setBusy('save')
    try {
      await api.saveProduct({ ...p, slug })
      await refresh()
      flash('Produto guardado.')
      if (isNew) navigate(`/admin/produtos/${p.id}`, { replace: true })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não foi possível guardar.')
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    if (!confirmDelete) return setConfirmDelete(true)
    await api.deleteProduct(p.id)
    await refresh()
    navigate('/admin/produtos')
  }
  const unused = colors.filter((c) => !p.colors.some((pc) => pc.colorId === c.id))

  return (
    <>
      <Link to="/admin/produtos" className="text-sm text-muted hover:text-navy">← Produtos</Link>
      <PageTitle
        action={
          <div className="flex flex-wrap gap-2">
            {!isNew && (
              <a href={`/produto/${p.slug}`} target="_blank" className="btn-outline px-4 py-2.5">
                Ver na loja ↗
              </a>
            )}
            <button onClick={save} disabled={busy === 'save'} className="btn-primary px-5 py-2.5 max-md:hidden">
              {busy === 'save' ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        }
      >
        {isNew ? 'Novo produto' : p.name}
      </PageTitle>
      {err && <p className="mb-4 rounded-xl bg-danger/10 p-3 text-sm text-danger">{err}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr] [&>*]:min-w-0">
        <div className="grid h-fit gap-6">
          <Card title="Informação">
            <div className="grid gap-4">
              <label>
                <span className="label">Nome</span>
                <input className="field" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
              </label>
              <label>
                <span className="label">Endereço na loja (slug)</span>
                <input className="field" placeholder={slugify(p.name) || 'conjunto-scrub'} value={p.slug} onChange={(e) => setP({ ...p, slug: slugify(e.target.value) })} />
              </label>
              <label>
                <span className="label">Descrição</span>
                <textarea className="field min-h-28" value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} />
              </label>
              <label>
                <span className="label">Preço (MZN) · vazio = “Preço sob consulta”</span>
                <input
                  className="field num"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={p.price ?? ''}
                  onChange={(e) => setP({ ...p, price: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </label>
              <fieldset>
                <legend className="label">Categorias</legend>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const on = p.categories.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setP({ ...p, categories: on ? p.categories.filter((x) => x !== c.id) : [...p.categories, c.id as CategoryId] })
                        }
                        className={`rounded-full border px-3 py-1.5 text-sm ${on ? 'border-navy bg-navy text-white' : 'border-line'}`}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-5 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} /> Visível na loja
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={p.isNew} onChange={(e) => setP({ ...p, isNew: e.target.checked })} /> Marcar como novidade
                </label>
              </div>
            </div>
          </Card>

          <Card title="Modelo 3D">
            <p className="mb-3 text-sm text-muted">
              Opcional. Um ficheiro <b>.glb</b> do uniforme permite rodar 360° na página do produto. Sem modelo, a página mostra as fotografias.
            </p>
            {p.modelUrl ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-teal-soft px-3 py-1 font-semibold text-teal-deep">Modelo carregado</span>
                <button className="text-danger underline" onClick={() => setP({ ...p, modelUrl: null })}>Remover</button>
              </div>
            ) : (
              <Upload label="Carregar .glb" accept=".glb,model/gltf-binary" busy={busy === 'model'} onFile={async (f) => {
                const url = await upload('model', f, 'modelos')
                if (url) setP((x) => ({ ...x, modelUrl: url }))
              }} />
            )}
          </Card>

          {!isNew && (
            <button onClick={remove} className="text-left text-sm text-danger underline">
              {confirmDelete ? 'Clique de novo para apagar definitivamente' : 'Apagar produto'}
            </button>
          )}
        </div>

        <Card
          title="Cores, fotografias e stock"
          action={
            unused.length > 0 && (
              <select
                className="field w-auto py-2 text-sm"
                value=""
                onChange={(e) =>
                  e.target.value &&
                  setP({ ...p, colors: [...p.colors, { id: uid(), colorId: e.target.value, images: {}, stock: {}, pending: 0 }] })
                }
              >
                <option value="">+ Adicionar cor</option>
                {unused.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )
          }
        >
          {p.colors.length === 0 && <p className="text-sm text-muted">Adicione pelo menos uma cor para o produto aparecer à venda.</p>}
          <ul className="grid gap-4">
            {p.colors.map((pc) => {
              const c = color(pc.colorId)
              return (
                <li key={pc.id} className="rounded-2xl border border-line p-4">
                  <div className="flex items-center gap-3">
                    <span className="size-6 rounded-full ring-1 ring-black/10" style={{ background: c?.swatch || c?.hex }} />
                    <span className="font-semibold text-navy">{c?.name}</span>
                    <button
                      className="ml-auto text-xs text-danger underline"
                      onClick={() => setP({ ...p, colors: p.colors.filter((x) => x.id !== pc.id) })}
                    >
                      Retirar cor
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
                    {settings.sizes.map((s) => (
                      <label key={s} className="text-center">
                        <span className="mb-1 block text-xs font-bold text-navy">{s}</span>
                        <input
                          className="field num px-2 py-2 text-center"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={pc.stock[s] ?? 0}
                          onChange={(e) => setColor(pc.id, { stock: { ...pc.stock, [s]: Math.max(0, parseInt(e.target.value) || 0) } })}
                        />
                      </label>
                    ))}
                    <label className="text-center">
                      <span className="mb-1 block text-xs font-bold text-muted" title="Peças reservadas no inventário interno, não vendidas no site">A confirmar</span>
                      <input
                        className="field num bg-sand px-2 py-2 text-center"
                        type="number"
                        min="0"
                        value={pc.pending}
                        onChange={(e) => setColor(pc.id, { pending: Math.max(0, parseInt(e.target.value) || 0) })}
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(['front', 'back'] as const).map((v) => (
                      <div key={v} className="grid gap-2">
                        <div className="aspect-[4/5] overflow-hidden rounded-xl bg-mist">
                          <ProductVisual pc={pc} color={c} view={v} badge={false} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Upload
                            label={v === 'front' ? 'Foto frente' : 'Foto costas'}
                            accept="image/*"
                            busy={busy === pc.id + v}
                            onFile={async (f) => {
                              const url = await upload(pc.id + v, f, 'produtos')
                              if (url) setColor(pc.id, { images: { ...pc.images, [v]: url } })
                            }}
                          />
                          {pc.images[v] && (
                            <button className="text-xs text-danger underline" onClick={() => setColor(pc.id, { images: { ...pc.images, [v]: null } })}>
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(pc.images.gallery ?? []).map((src, i) => (
                      <div key={src.slice(-24) + i} className="grid gap-2">
                        <img src={src} alt="" className="aspect-[4/5] w-full rounded-xl object-cover" />
                        <button
                          className="justify-self-start text-xs text-danger underline"
                          onClick={() => setColor(pc.id, { images: { ...pc.images, gallery: pc.images.gallery!.filter((_, k) => k !== i) } })}
                        >
                          Remover detalhe
                        </button>
                      </div>
                    ))}
                    <div className="grid aspect-[4/5] place-items-center rounded-xl border border-dashed border-line">
                      <Upload
                        label="+ Foto de detalhe"
                        accept="image/*"
                        busy={busy === pc.id + 'g'}
                        onFile={async (f) => {
                          const url = await upload(pc.id + 'g', f, 'produtos')
                          if (url) setColor(pc.id, { images: { ...pc.images, gallery: [...(pc.images.gallery ?? []), url] } })
                        }}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
      {/* No telemóvel, o botão de guardar fica sempre à mão no fundo do ecrã. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur md:hidden">
        <button onClick={save} disabled={busy === 'save'} className="btn-primary w-full">
          {busy === 'save' ? 'A guardar…' : 'Guardar produto'}
        </button>
      </div>
      <Toast msg={toast} />
    </>
  )
}

import type { SupabaseClient } from '@supabase/supabase-js'
import { SEED_CATALOG, SEED_IMAGES } from '../data/seed'
import type { Catalog, Color, NewOrder, Order, OrderStatus, Product, ProductImages, Settings } from '../types'
import { idbGet, idbSet } from './idb'

/**
 * Camada de dados da loja.
 * - Com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY definidos, usa o Supabase (produção).
 * - Sem eles, usa uma base de dados local no navegador (demonstração e testes).
 * O resto da aplicação só conhece esta interface.
 */
export interface Api {
  mode: 'local' | 'supabase'
  getCatalog(): Promise<Catalog>
  placeOrder(order: NewOrder): Promise<Order>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  isAdmin(): Promise<boolean>
  listOrders(): Promise<Order[]>
  setOrderStatus(id: string, status: OrderStatus): Promise<void>
  saveProduct(p: Product): Promise<void>
  deleteProduct(id: string): Promise<void>
  saveColor(c: Color): Promise<void>
  deleteColor(id: string): Promise<void>
  saveSettings(s: Settings): Promise<void>
  uploadFile(file: File, folder: 'produtos' | 'modelos'): Promise<string>
}

export class StockError extends Error {}

/* ───────────────────────────── Local ───────────────────────────── */

interface LocalDb extends Catalog {
  orders: Order[]
  /** Atualizações de dados já aplicadas a esta base local (ver MIGRATIONS). */
  applied?: string[]
  // Marcadores antigos, substituídos por `applied`.
  waSeeded?: boolean
  socialSeeded?: boolean
  photosSeeded?: boolean
  photosVersion?: number
}

const DB_KEY = 'db:v1'
const SESSION_KEY = 'medique:admin'
const LOCAL_ADMIN_PASSWORD = import.meta.env.VITE_LOCAL_ADMIN_PASSWORD || 'medique'

const seedProduct = (db: LocalDb) => db.products.find((p) => p.id === SEED_CATALOG.products[0].id)

/** Põe as fotografias iniciais nas cores que ainda não têm nenhuma. */
function seedPhotos(db: LocalDb) {
  for (const pc of seedProduct(db)?.colors ?? []) {
    const seed = SEED_IMAGES[pc.colorId]
    if (seed && !pc.images.front && !pc.images.back) pc.images = structuredClone(seed)
  }
}

/**
 * Novidades dos dados iniciais que têm de chegar a lojas locais já abertas antes.
 * Cada passo corre uma vez e só preenche o que está vazio, sem apagar alterações feitas no painel.
 * Para acrescentar uma novidade, junte um passo novo no fim (nunca mude o nome de um existente).
 */
const MIGRATIONS: [string, (db: LocalDb) => void][] = [
  ['whatsapp', (db) => {
    if (!db.settings.whatsapp) db.settings.whatsapp = SEED_CATALOG.settings.whatsapp
  }],
  ['fotos-2', seedPhotos],
  ['redes', (db) => {
    for (const k of ['instagram', 'facebook', 'x', 'tiktok'] as const) if (!db.settings[k]) db.settings[k] = SEED_CATALOG.settings[k]
  }],
  ['fotos-3', seedPhotos],
  ['fotos-4', seedPhotos],
  ['fotos-5', seedPhotos],
  ['fotos-6', seedPhotos],
  ['unissexo', (db) => {
    const p = seedProduct(db)
    if (p) for (const c of ['feminino', 'masculino'] as const) if (!p.categories.includes(c)) p.categories.push(c)
  }],
]

/** Converte os marcadores antigos para a lista `applied`. */
function legacyApplied(db: LocalDb) {
  const out: string[] = []
  if (db.waSeeded) out.push('whatsapp')
  if ((db.photosVersion ?? 0) >= 2) out.push('fotos-2')
  if (db.socialSeeded) out.push('redes')
  return out
}

async function readDb(): Promise<LocalDb> {
  // Se o armazenamento do navegador estiver bloqueado ou lento, segue com o stock inicial.
  const db = await Promise.race([
    idbGet<LocalDb>(DB_KEY),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Armazenamento do navegador indisponível.')), 2500)),
  ])
  if (db) {
    const applied = new Set(db.applied ?? legacyApplied(db))
    const pending = MIGRATIONS.filter(([name]) => !applied.has(name))
    if (pending.length || !db.applied) {
      for (const [name, run] of pending) {
        run(db)
        applied.add(name)
      }
      db.applied = [...applied]
      delete db.waSeeded
      delete db.socialSeeded
      delete db.photosSeeded
      delete db.photosVersion
      await idbSet(DB_KEY, db)
    }
    return db
  }
  const fresh: LocalDb = { ...structuredClone(SEED_CATALOG), orders: [], applied: MIGRATIONS.map(([name]) => name) }
  await idbSet(DB_KEY, fresh)
  return fresh
}

/** Reduz a fotografia para, no máximo, `max` px de lado. As fotos de telemóvel têm vários MB; assim ficam leves. */
async function scaleImage(file: File, max = 1600): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return canvas
}

const compressImage = async (file: File) => (await scaleImage(file)).toDataURL('image/jpeg', 0.86)

const compressToBlob = async (file: File) => {
  const canvas = await scaleImage(file)
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível preparar a imagem.'))), 'image/jpeg', 0.86),
  )
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })

function adjustStock(db: LocalDb, items: Order['items'], sign: 1 | -1) {
  for (const it of items) {
    const pc = db.products.flatMap((p) => p.colors).find((c) => c.id === it.productColorId)
    if (!pc) throw new StockError(`O produto ${it.name} (${it.colorName}) já não existe.`)
    const have = pc.stock[it.size] ?? 0
    if (sign === -1 && have < it.qty)
      throw new StockError(`Só temos ${have} em ${it.colorName}, tamanho ${it.size}.`)
    pc.stock[it.size] = have + sign * it.qty
  }
}

const localApi: Api = {
  mode: 'local',
  async getCatalog() {
    const { products, colors, settings } = await readDb()
    return { products, colors, settings }
  },
  async placeOrder(input) {
    const db = await readDb()
    adjustStock(db, input.items, -1)
    const priced = input.items.map((it) => ({
      ...it,
      unitPrice: db.products.find((p) => p.id === it.productId)?.price ?? null,
    }))
    const total = priced.some((i) => i.unitPrice == null)
      ? null
      : priced.reduce((a, i) => a + i.unitPrice! * i.qty, 0)
    const order: Order = {
      ...input,
      items: priced,
      id: crypto.randomUUID(),
      number: 1000 + db.orders.length + 1,
      createdAt: new Date().toISOString(),
      total,
      status: 'nova',
      channel: 'whatsapp',
    }
    db.orders.unshift(order)
    await idbSet(DB_KEY, db)
    return order
  },
  async signIn(_email, password) {
    if (password !== LOCAL_ADMIN_PASSWORD) throw new Error('Palavra-passe incorreta.')
    sessionStorage.setItem(SESSION_KEY, '1')
  },
  async signOut() {
    sessionStorage.removeItem(SESSION_KEY)
  },
  async isAdmin() {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  },
  async listOrders() {
    return (await readDb()).orders
  },
  async setOrderStatus(id, status) {
    const db = await readDb()
    const o = db.orders.find((x) => x.id === id)
    if (!o) return
    if (status === 'cancelada' && o.status !== 'cancelada') adjustStock(db, o.items, 1)
    if (status !== 'cancelada' && o.status === 'cancelada') adjustStock(db, o.items, -1)
    o.status = status
    await idbSet(DB_KEY, db)
  },
  async saveProduct(p) {
    const db = await readDb()
    const i = db.products.findIndex((x) => x.id === p.id)
    if (i >= 0) db.products[i] = p
    else db.products.push(p)
    await idbSet(DB_KEY, db)
  },
  async deleteProduct(id) {
    const db = await readDb()
    db.products = db.products.filter((p) => p.id !== id)
    await idbSet(DB_KEY, db)
  },
  async saveColor(c) {
    const db = await readDb()
    const i = db.colors.findIndex((x) => x.id === c.id)
    if (i >= 0) db.colors[i] = c
    else db.colors.push(c)
    await idbSet(DB_KEY, db)
  },
  async deleteColor(id) {
    const db = await readDb()
    if (db.products.some((p) => p.colors.some((c) => c.colorId === id)))
      throw new Error('Esta cor está a ser usada num produto. Retire-a do produto primeiro.')
    db.colors = db.colors.filter((c) => c.id !== id)
    await idbSet(DB_KEY, db)
  },
  async saveSettings(s) {
    const db = await readDb()
    db.settings = s
    await idbSet(DB_KEY, db)
  },
  async uploadFile(file, folder) {
    if (folder === 'produtos') return compressImage(file)
    if (file.size > 15 * 1024 * 1024) throw new Error('Em modo local, o modelo 3D deve ter até 15 MB.')
    return readAsDataUrl(file)
  },
}

/* ─────────────────────────── Supabase ─────────────────────────── */

let client: SupabaseClient | null = null
async function sb() {
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!)
  }
  return client
}

function check<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) {
    const m = res.error.message
    if (m.includes('SEM_STOCK')) {
      const [, color, size] = m.split(':')
      throw new StockError(`Já não temos stock suficiente em ${color}, tamanho ${size}.`)
    }
    throw new Error(m)
  }
  return res.data as NonNullable<T>
}

/**
 * Se uma cor do conjunto inicial ainda não tem fotografia na base de dados, usa a que vem com o site
 * (pasta public/produtos). Assim, fotos novas aparecem logo depois de publicar, sem mexer no Supabase.
 * Uma foto carregada no painel tem sempre prioridade.
 */
function withSeedPhotos(slug: string, colorId: string, images: ProductImages): ProductImages {
  if (slug !== SEED_CATALOG.products[0].slug || images.front || images.back) return images
  return SEED_IMAGES[colorId] ?? images
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const toProduct = (r: any): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description ?? '',
  categories: r.categories ?? [],
  price: r.price == null ? null : Number(r.price),
  isNew: r.is_new,
  active: r.active,
  modelUrl: r.model_url,
  createdAt: r.created_at,
  colors: (r.product_colors ?? []).map((pc: any) => ({
    id: pc.id,
    colorId: pc.color_id,
    images: withSeedPhotos(r.slug, pc.color_id, pc.images ?? {}),
    pending: pc.pending ?? 0,
    stock: Object.fromEntries((pc.variants ?? []).map((v: any) => [v.size, v.stock])),
  })),
})

const toOrder = (r: any): Order => ({
  id: r.id,
  number: r.number,
  createdAt: r.created_at,
  customer: r.customer,
  address: r.address,
  items: r.items,
  total: r.total == null ? null : Number(r.total),
  status: r.status,
  notes: r.notes ?? undefined,
  channel: r.channel,
})

const supabaseApi: Api = {
  mode: 'supabase',
  async getCatalog() {
    const db = await sb()
    const [products, colors, settings] = await Promise.all([
      db.from('products').select('*, product_colors(*, variants(*))').order('created_at'),
      db.from('colors').select('*').order('sort'),
      db.from('settings').select('*'),
    ])
    const s = Object.fromEntries(check(settings).map((r: any) => [r.key, r.value]))
    return {
      products: check(products).map(toProduct),
      colors: check(colors),
      settings: { ...SEED_CATALOG.settings, ...s },
    }
  },
  async placeOrder(order) {
    const db = await sb()
    return toOrder(check(await db.rpc('place_order', { payload: order })))
  },
  async signIn(email, password) {
    const db = await sb()
    const { error } = await db.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Email ou palavra-passe incorretos.')
    if (!(await this.isAdmin())) {
      await db.auth.signOut()
      throw new Error('Esta conta não tem acesso ao painel.')
    }
  },
  async signOut() {
    await (await sb()).auth.signOut()
  },
  async isAdmin() {
    const db = await sb()
    const { data } = await db.auth.getSession()
    if (!data.session) return false
    const res = await db.rpc('is_admin')
    return res.data === true
  },
  async listOrders() {
    const db = await sb()
    return check(await db.from('orders').select('*').order('created_at', { ascending: false })).map(toOrder)
  },
  async setOrderStatus(id, status) {
    const db = await sb()
    check(await db.rpc('set_order_status', { order_id: id, new_status: status }))
  },
  async saveProduct(p) {
    const db = await sb()
    check(
      await db.from('products').upsert({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        categories: p.categories,
        price: p.price,
        is_new: p.isNew,
        active: p.active,
        model_url: p.modelUrl,
      }),
    )
    const keep = p.colors.map((c) => c.id)
    let del = db.from('product_colors').delete().eq('product_id', p.id)
    if (keep.length) del = del.not('id', 'in', `(${keep.join(',')})`)
    check(await del)
    if (!p.colors.length) return
    check(
      await db.from('product_colors').upsert(
        p.colors.map((c) => ({ id: c.id, product_id: p.id, color_id: c.colorId, images: c.images, pending: c.pending })),
      ),
    )
    const variants = p.colors.flatMap((c) =>
      Object.entries(c.stock).map(([size, stock]) => ({ product_color_id: c.id, size, stock })),
    )
    if (variants.length) check(await db.from('variants').upsert(variants))
  },
  async deleteProduct(id) {
    check(await (await sb()).from('products').delete().eq('id', id))
  },
  async saveColor(c) {
    check(await (await sb()).from('colors').upsert(c))
  },
  async deleteColor(id) {
    check(await (await sb()).from('colors').delete().eq('id', id))
  },
  async saveSettings(s) {
    const rows = Object.entries(s).map(([key, value]) => ({ key, value }))
    check(await (await sb()).from('settings').upsert(rows))
  },
  async uploadFile(file, folder) {
    const db = await sb()
    let body: Blob = file
    let ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    if (folder === 'produtos') {
      try {
        body = await compressToBlob(file)
        ext = 'jpg'
      } catch {
        /* formato que o navegador não sabe reduzir: envia o original */
      }
    }
    const path = `${folder}/${crypto.randomUUID()}.${ext}`
    check(await db.storage.from('media').upload(path, body, { cacheControl: '31536000', contentType: body.type || file.type }))
    return db.storage.from('media').getPublicUrl(path).data.publicUrl
  },
}

export const api: Api =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY ? supabaseApi : localApi

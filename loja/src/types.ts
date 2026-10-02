export type CategoryId = 'feminino' | 'masculino' | 'conjuntos' | 'novidades'

export interface Color {
  id: string
  name: string
  hex: string
  /** Fundo CSS opcional para amostras com padrão (ex.: camuflado). */
  swatch?: string | null
  sort: number
}

export interface ProductImages {
  front?: string | null
  back?: string | null
  gallery?: string[]
}

export interface ProductColor {
  id: string
  colorId: string
  images: ProductImages
  /** Quantidade por tamanho disponível para venda. */
  stock: Record<string, number>
  /** Unidades reservadas no inventário interno (ex.: tamanho por confirmar). Nunca vendidas no site. */
  pending: number
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  categories: CategoryId[]
  /** Preço em MZN. null = ainda não definido no painel. */
  price: number | null
  isNew: boolean
  active: boolean
  /** URL de um modelo 3D (.glb). Sem modelo, a página usa a galeria de fotografias. */
  modelUrl: string | null
  colors: ProductColor[]
  createdAt: string
}

export interface Settings {
  whatsapp: string
  instagram: string
  facebook: string
  x: string
  tiktok: string
  email: string
  sizes: string[]
}

export interface Catalog {
  products: Product[]
  colors: Color[]
  settings: Settings
}

export type OrderStatus = 'nova' | 'confirmada' | 'paga' | 'enviada' | 'entregue' | 'cancelada'

export interface OrderItem {
  productId: string
  productColorId: string
  name: string
  colorName: string
  size: string
  qty: number
  unitPrice: number | null
}

export interface Customer {
  name: string
  phone: string
  email?: string
}

export interface Address {
  province: string
  city: string
  street: string
  reference?: string
}

export interface Order {
  id: string
  number: number
  createdAt: string
  customer: Customer
  address: Address
  items: OrderItem[]
  total: number | null
  status: OrderStatus
  notes?: string
  channel: 'whatsapp'
}

export interface NewOrder {
  customer: Customer
  address: Address
  items: OrderItem[]
  notes?: string
}

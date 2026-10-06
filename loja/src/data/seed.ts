import type { Catalog, Color, Product, ProductImages } from '../types'

export const CATEGORIES = [
  { id: 'feminino', label: 'Scrubs femininos' },
  { id: 'masculino', label: 'Scrubs masculinos' },
  { id: 'conjuntos', label: 'Conjuntos completos' },
  { id: 'novidades', label: 'Novidades' },
] as const

export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const CAMO =
  'radial-gradient(circle at 30% 35%,#4F5D2F 0 28%,transparent 30%),radial-gradient(circle at 70% 65%,#2F3A1E 0 26%,transparent 28%),radial-gradient(circle at 75% 25%,#8A8F5A 0 20%,transparent 22%),#6B7440'

export const SEED_COLORS: Color[] = [
  { id: 'azul-royal', name: 'Azul Royal', hex: '#2850B8' },
  { id: 'azul-turquesa', name: 'Azul Claro / Turquesa', hex: '#43BCD3' },
  { id: 'branco', name: 'Branco', hex: '#F8F8F6' },
  { id: 'rosa', name: 'Rosa / Vermelho-rosa', hex: '#DD5577' },
  { id: 'pink', name: 'Rosa Forte / Pink', hex: '#E0358C' },
  { id: 'rosa-salmao', name: 'Rosa Salmão / Coral Claro', hex: '#F2A08B' },
  { id: 'vermelho', name: 'Vermelho', hex: '#C4232E' },
  { id: 'bege', name: 'Bege Claro / Creme', hex: '#EADCC4' },
  { id: 'bordo', name: 'Bordô / Vinho', hex: '#6B1A2D' },
  { id: 'azul-petroleo', name: 'Azul Petróleo', hex: '#1B5E6B' },
  { id: 'verde-lima', name: 'Verde-lima', hex: '#98CF55' },
  { id: 'verde-garrafa', name: 'Verde Escuro / Verde Garrafa', hex: '#1F4D34' },
  { id: 'preto', name: 'Preto', hex: '#1B1E22' },
  { id: 'cinzento', name: 'Cinzento / Cinza', hex: '#9AA3AB' },
  { id: 'camuflado', name: 'Camuflado Verde', hex: '#6B7440', swatch: CAMO },
].map((c, i) => ({ ...c, sort: i }))

// Fotografias reais da MEDIQUE (pasta public/produtos).
export const SEED_IMAGES: Record<string, ProductImages> = {
  'azul-royal': { front: '/produtos/azul-royal-mulher.jpg', gallery: ['/produtos/azul-royal-homem.jpg'] },
  bege: { front: '/produtos/bege-frente-costas.jpg' },
  rosa: { front: '/produtos/rosa-frente.jpg', gallery: ['/produtos/rosa-lado.jpg'] },
  'azul-petroleo': {
    front: '/produtos/petroleo-mulher.jpg',
    gallery: ['/produtos/petroleo-casal.jpg', '/produtos/petroleo-homem.jpg'],
  },
  cinzento: {
    front: '/produtos/cinzento-mulher.jpg',
    gallery: ['/produtos/cinzento-casal.jpg', '/produtos/cinzento-homem.jpg'],
  },
  bordo: { front: '/produtos/bordo-mulher.jpg', gallery: ['/produtos/bordo-casal.jpg'] },
  'azul-turquesa': { front: '/produtos/turquesa-mulher.jpg', gallery: ['/produtos/turquesa-homem.jpg'] },
  pink: { front: '/produtos/pink-mulher.jpg', gallery: ['/produtos/pink-homem.jpg'] },
  'verde-garrafa': { front: '/produtos/verde-garrafa-mulher.jpg', gallery: ['/produtos/verde-garrafa-homem.jpg'] },
  'rosa-salmao': { front: '/produtos/salmao-mulher.jpg', gallery: ['/produtos/salmao-homem.jpg'] },
}


// Stock inicial real: 35 uniformes (34 à venda + 1 pink com tamanho por confirmar, reservado).
const STOCK: Record<string, [Record<string, number>, number?]> = {
  'azul-royal': [{ S: 2, M: 3, L: 2 }],
  'azul-turquesa': [{ S: 1, L: 1 }],
  branco: [{ S: 2, L: 1, XL: 1 }],
  rosa: [{ M: 1 }],
  pink: [{ S: 3, M: 1 }, 1],
  'rosa-salmao': [{ S: 2 }],
  vermelho: [{ S: 2, XL: 1 }],
  bege: [{ M: 1 }],
  bordo: [{ M: 1, L: 1 }],
  'azul-petroleo': [{ S: 1 }],
  'verde-lima': [{ S: 2 }],
  'verde-garrafa': [{ S: 1, XL: 1 }],
  preto: [{ S: 1 }],
  cinzento: [{ S: 1 }],
  camuflado: [{ M: 1 }],
}

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'p-conjunto-scrub',
    slug: 'conjunto-scrub-medique',
    name: 'Conjunto Scrub MEDIQUE',
    description:
      'Conjunto de blusa e calça para o dia a dia de médicos, enfermeiros e equipas de saúde. Disponível em 15 cores.',
    categories: ['feminino', 'masculino', 'conjuntos', 'novidades'],
    price: 2000,
    isNew: true,
    active: true,
    modelUrl: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    colors: Object.entries(STOCK).map(([colorId, [stock, pending]]) => ({
      id: `pc-${colorId}`,
      colorId,
      images: SEED_IMAGES[colorId] ?? {},
      stock,
      pending: pending ?? 0,
    })),
  },
]

export const SEED_CATALOG: Catalog = {
  products: SEED_PRODUCTS,
  colors: SEED_COLORS,
  settings: {
    whatsapp: 'https://wa.me/message/5Z32NMOECZ27P1',
    instagram: 'https://www.instagram.com/medique_lda',
    facebook: 'https://www.facebook.com/share/1H4BAY1Ypu/',
    x: 'https://x.com/medique258',
    tiktok: 'https://www.tiktok.com/@medique_259',
    email: '',
    sizes: DEFAULT_SIZES,
  },
}

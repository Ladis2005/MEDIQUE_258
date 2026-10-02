import type { Product, ProductColor } from '../types'

export const qtyOf = (pc: ProductColor | undefined, size: string) => (pc ? pc.stock[size] ?? 0 : 0)

export const colorTotal = (pc: ProductColor) => Object.values(pc.stock).reduce((a, b) => a + b, 0)

export const productTotal = (p: Product) => p.colors.reduce((a, pc) => a + colorTotal(pc), 0)

export const pendingTotal = (p: Product) => p.colors.reduce((a, pc) => a + pc.pending, 0)

/** Cores com pelo menos uma peça à venda. */
export const colorsInStock = (p: Product) => p.colors.filter((pc) => colorTotal(pc) > 0)

export const sizesInStock = (pc: ProductColor, sizes: string[]) => sizes.filter((s) => qtyOf(pc, s) > 0)

export const isSoldOut = (p: Product) => productTotal(p) === 0

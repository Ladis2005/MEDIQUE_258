import type { Product } from '../types'
import { colorTotal, qtyOf } from './stock'

export interface Listing {
  product: Product
  colorId: string
}

/** Uma entrada por produto e cor em stock (como nas lojas de moda), filtrável por cor e tamanho. */
export function listings(products: Product[], opts: { color?: string; size?: string } = {}): Listing[] {
  return products.flatMap((product) =>
    product.colors
      .filter((pc) => (!opts.color || pc.colorId === opts.color) && (opts.size ? qtyOf(pc, opts.size) > 0 : colorTotal(pc) > 0))
      .map((pc) => ({ product, colorId: pc.colorId })),
  )
}

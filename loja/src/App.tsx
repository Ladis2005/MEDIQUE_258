import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { CartDrawer } from './components/CartDrawer'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import { About, Contact, Privacy, SizeGuide, Terms } from './pages/Info'
import { pixel } from './lib/pixel'
import NotFound from './pages/NotFound'
import OrderDone from './pages/OrderDone'
import ProductPage from './pages/ProductPage'
import Shop from './pages/Shop'
import { CartProvider } from './state/cart'
import { CatalogProvider, useCatalog } from './state/catalog'

const Admin = lazy(() => import('./admin/Admin'))

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

/** Conta uma visita no pixel a cada mudança de página da loja. O painel fica de fora. */
function PixelPageViews() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!pathname.startsWith('/admin')) pixel.pageView()
  }, [pathname])
  return null
}

function hideBoot() {
  const el = document.getElementById('boot')
  if (!el) return
  el.style.opacity = '0'
  setTimeout(() => el.remove(), 450)
}

/** Remove o ecrã de carregamento quando o catálogo chega (ou, no máximo, ao fim de 3 segundos). */
function BootSplash() {
  const { loading } = useCatalog()
  useEffect(() => {
    const t = setTimeout(hideBoot, 3000)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (!loading) hideBoot()
  }, [loading])
  return null
}

function StoreLayout() {
  const location = useLocation()
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      <CartDrawer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CatalogProvider>
        <CartProvider>
          <BootSplash />
          <ScrollTop />
          <PixelPageViews />
          <Routes>
            <Route element={<StoreLayout />}>
              <Route index element={<Home />} />
              <Route path="loja" element={<Shop />} />
              <Route path="loja/:categoria" element={<Shop />} />
              <Route path="produto/:slug" element={<ProductPage />} />
              <Route path="carrinho" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="encomenda/:number" element={<OrderDone />} />
              <Route path="sobre" element={<About />} />
              <Route path="guia-de-tamanhos" element={<SizeGuide />} />
              <Route path="contactos" element={<Contact />} />
              <Route path="privacidade" element={<Privacy />} />
              <Route path="termos" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route
              path="admin/*"
              element={
                <Suspense fallback={<div className="grid min-h-dvh place-items-center text-muted">A carregar painel…</div>}>
                  <Admin />
                </Suspense>
              }
            />
          </Routes>
        </CartProvider>
      </CatalogProvider>
    </BrowserRouter>
  )
}

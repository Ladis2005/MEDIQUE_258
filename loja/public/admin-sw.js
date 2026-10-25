// Service worker do painel: só serve para mostrar avisos de venda.
// No Android, o Chrome só deixa um site mostrar notificações através de um service worker.
// Também recebe os avisos enviados pelo servidor (api/order-notify.js), mesmo com o painel fechado.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let d = {}
  try {
    d = e.data ? e.data.json() : {}
  } catch {
    d = { body: e.data?.text() }
  }
  e.waitUntil(
    self.registration.showNotification(d.title || 'Nova venda MEDIQUE', {
      body: d.body || 'Abra o painel para ver a encomenda.',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: d.tag,
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: d.url || '/admin/encomendas' },
    }),
  )
})

// Tocar no aviso abre (ou traz para a frente) o painel na encomenda.
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/admin/encomendas'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => new URL(c.url).pathname.startsWith('/admin'))
      if (open) return open.focus().then(() => open.navigate(url))
      return self.clients.openWindow(url)
    }),
  )
})

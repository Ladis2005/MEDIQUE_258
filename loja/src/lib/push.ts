import { api } from './api'

/** Chave pública das notificações push (igual a VAPID_PUBLIC_KEY em api/order-notify.js). */
const VAPID_PUBLIC_KEY = 'BMRoWcMp95sfuvUT3_22a4uGfLpFCpEWviRZq8fkxOBL1dzd1RRjGVCFfvp1Ixl1PP6qjAZcXOy_HlA3jNSZkxk'

const toBytes = (b64: string) => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && api.mode === 'supabase'

/**
 * Regista este aparelho para receber avisos de venda enviados pelo servidor,
 * mesmo com o painel fechado. Devolve true se ficou registado.
 */
export async function enablePush(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin' })
    await navigator.serviceWorker.ready
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(VAPID_PUBLIC_KEY) }))
    await api.savePushSubscription(sub.toJSON())
    return true
  } catch (e) {
    console.warn('Avisos push indisponíveis:', e)
    return false
  }
}

/**
 * Aviso de venda nova, enviado pelo servidor (funciona com o painel fechado).
 *
 * Quem chama: o Supabase, no instante em que entra uma encomenda (supabase/notifications.sql).
 * O que faz: envia uma notificação push para os telemóveis com avisos ativados no painel
 * e um email para NOTIFY_EMAIL.
 *
 * Variáveis na Vercel (Settings → Environment Variables):
 *   NOTIFY_SECRET      a mesma palavra secreta guardada no Supabase (impede avisos falsos)
 *   VAPID_PRIVATE_KEY  chave privada das notificações push
 *   RESEND_API_KEY     chave da conta Resend (envio de emails)
 *   NOTIFY_EMAIL       quem recebe o email; vários separados por vírgula
 */
import webpush from 'web-push'

// Chave pública das notificações push (igual a VAPID_PUBLIC_KEY em src/lib/push.ts).
const VAPID_PUBLIC_KEY = 'BMRoWcMp95sfuvUT3_22a4uGfLpFCpEWviRZq8fkxOBL1dzd1RRjGVCFfvp1Ixl1PP6qjAZcXOy_HlA3jNSZkxk'
const SITE = 'https://medique-seven.vercel.app'

const mzn = (n) => `${new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2 }).format(n)} MT`
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function summary(order) {
  const items = (order.items ?? []).map((i) => `${i.qty}× ${i.colorName} ${i.size}`).join(', ')
  const total = order.total == null ? 'preço a confirmar' : mzn(Number(order.total))
  return { items, total }
}

async function sendPushes(order, subscriptions) {
  const key = process.env.VAPID_PRIVATE_KEY
  if (!key || !subscriptions?.length) return { sent: 0, failed: 0, skipped: !key ? 'sem VAPID_PRIVATE_KEY' : 'sem telemóveis registados' }
  webpush.setVapidDetails(`mailto:${(process.env.NOTIFY_EMAIL || 'geral@medique.co.mz').split(',')[0].trim()}`, VAPID_PUBLIC_KEY, key)
  const { items, total } = summary(order)
  const payload = JSON.stringify({
    title: `Nova venda · encomenda nº ${order.number}`,
    body: `${order.customer?.name ?? 'Cliente'}: ${items} · ${total}`,
    tag: order.id,
    url: `/admin/encomendas?abrir=${order.id}`,
  })
  const results = await Promise.allSettled(subscriptions.map((s) => webpush.sendNotification(s, payload, { TTL: 24 * 3600, urgency: 'high' })))
  const failed = results.filter((r) => r.status === 'rejected')
  for (const f of failed) console.error('push falhou:', f.reason?.statusCode, f.reason?.body || f.reason?.message)
  return { sent: results.length - failed.length, failed: failed.length }
}

async function sendEmail(order) {
  const apiKey = process.env.RESEND_API_KEY
  const to = (process.env.NOTIFY_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!apiKey || !to.length) return { skipped: !apiKey ? 'sem RESEND_API_KEY' : 'sem NOTIFY_EMAIL' }
  const { items, total } = summary(order)
  const c = order.customer ?? {}
  const a = order.address ?? {}
  const rows = (order.items ?? [])
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.qty)}× ${esc(i.name)}</td><td style="padding:6px 0;color:#5a6b7c">${esc(i.colorName)} · ${esc(i.size)}</td></tr>`)
    .join('')
  const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;color:#0c2236">
  <h2 style="color:#073b70;margin:0 0 4px">Nova venda · encomenda nº ${esc(order.number)}</h2>
  <p style="margin:0 0 16px;color:#5a6b7c">Saiu do stock: ${esc(items)}</p>
  <table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8ee;border-bottom:1px solid #e2e8ee">${rows}</table>
  <p style="font-size:18px;margin:16px 0"><b>Total: ${esc(total)}</b></p>
  <p style="margin:0"><b>${esc(c.name)}</b><br>${esc(c.phone)}${c.email ? `<br>${esc(c.email)}` : ''}</p>
  <p style="margin:8px 0 0;color:#5a6b7c">${esc(a.street)}, ${esc(a.city)}, ${esc(a.province)}${a.reference ? `<br>Ref.: ${esc(a.reference)}` : ''}</p>
  ${order.notes ? `<p style="margin:12px 0 0;color:#5a6b7c">Notas: ${esc(order.notes)}</p>` : ''}
  <p style="margin:24px 0"><a href="${SITE}/admin/encomendas?abrir=${esc(order.id)}" style="background:#073b70;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none">Abrir no painel</a></p>
</div>`
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM || 'MEDIQUE <onboarding@resend.dev>',
      to,
      subject: `Nova venda nº ${order.number} · ${items}`,
      html,
    }),
  })
  if (!r.ok) {
    const body = await r.text()
    console.error('email falhou:', r.status, body)
    return { error: r.status }
  }
  return { sent: to.length }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Só POST' })
  const secret = process.env.NOTIFY_SECRET
  if (!secret || req.headers['x-notify-secret'] !== secret) return res.status(401).json({ error: 'Não autorizado' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const order = body?.order
  if (!order?.id) return res.status(400).json({ error: 'Falta a encomenda' })

  const [push, email] = await Promise.all([
    sendPushes(order, body.subscriptions).catch((e) => ({ error: e.message })),
    sendEmail(order).catch((e) => ({ error: e.message })),
  ])
  console.log('aviso de venda', order.number, JSON.stringify({ push, email }))
  return res.status(200).json({ push, email })
}

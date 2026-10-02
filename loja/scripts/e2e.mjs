// Teste de ponta a ponta da loja MEDIQUE via Chrome DevTools Protocol (Edge headless).
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.env.BASE || 'http://localhost:4175'
const OUT = process.env.OUT
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
// Porta diferente em cada execução, para nunca apanhar um Edge que tenha ficado aberto.
const PORT = 9300 + Math.floor(Math.random() * 600)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const check = (name, ok, info = '') => {
  results.push({ name, ok, info })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`)
}

const profile = mkdtempSync(join(tmpdir(), 'medique-e2e-'))
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--remote-allow-origins=*', 'about:blank'], { stdio: 'ignore' })

let ws, id = 0
const pending = new Map()
const consoleErrors = []
async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      const page = list.find((t) => t.type === 'page')
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl)
        await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
        ws.onmessage = (ev) => {
          const m = JSON.parse(ev.data)
          if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
          if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
          if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(' '))
        }
        return
      }
    } catch {}
    await sleep(500)
  }
  throw new Error('Edge não arrancou')
}
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'erro JS')
  return r.result?.result?.value
}
async function waitFor(expr, timeout = 20000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    try { if (await evalJs(expr)) return true } catch {}
    await sleep(250)
  }
  return false
}
async function go(path) {
  await send('Page.navigate', { url: BASE + path })
  await waitFor(`document.readyState === 'complete' && !document.getElementById('boot')`)
  await sleep(900)
}
async function shot(name, full = false) {
  if (!OUT) return
  const params = { format: 'png' }
  if (full) {
    const m = await send('Page.getLayoutMetrics')
    const { width, height } = m.result.cssContentSize
    params.clip = { x: 0, y: 0, width, height: Math.min(height, 6000), scale: 1 }
    params.captureBeyondViewport = true
  }
  const r = await send('Page.captureScreenshot', params)
  writeFileSync(join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64'))
}
// Clica no primeiro elemento cujo texto corresponde (exato ou regex).
const click = (sel, text) => evalJs(`(() => {
  const re = ${text instanceof RegExp ? text.toString() : JSON.stringify(text)};
  const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find(e => typeof re === 'string' ? e.textContent.trim() === re : re.test(e.textContent.trim()));
  if (!el) return false; el.click(); return true })()`)
// Preenche um input controlado pelo React.
const fill = (sel, value) => evalJs(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false;
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  return true })()`)

try {
  await connect()
  await send('Page.enable'); await send('Runtime.enable')

  /* ── 1. Telemóvel (390 px) ── */
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  for (const [path, name] of [['/', 'm-home'], ['/loja', 'm-loja'], ['/produto/conjunto-scrub-medique?cor=bordo', 'm-produto'], ['/contactos', 'm-contactos']]) {
    await go(path)
    const w = await evalJs(`({ inner: innerWidth, scroll: document.documentElement.scrollWidth, wide: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed' && !e.closest('[class*=overflow-x-auto],[class*=overflow-hidden]') }).slice(0,4).map(e => e.tagName + '.' + String(e.className).slice(0,50)) })`)
    check(`telemóvel ${path}: sem scroll horizontal`, w.scroll <= w.inner, `largura ${w.scroll}/${w.inner}${w.wide.length ? ' · ' + w.wide.join(' | ') : ''}`)
    await shot(name, true)
  }

  // READONLY=1: só verifica páginas (útil com a base de dados real, para não criar encomendas de teste).
  if (process.env.READONLY) {
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false })
    await go('/produto/conjunto-scrub-medique?cor=azul-royal')
    const sz = await evalJs(`[...document.querySelectorAll('#comprar button[aria-pressed]')].filter(b => b.textContent.trim()).map(b => b.textContent.trim() + (b.disabled ? '×' : ''))`)
    check('produto azul royal: só S, M, L disponíveis', JSON.stringify(sz) === JSON.stringify(['XS×', 'S', 'M', 'L', 'XL×', 'XXL×']), sz.join(' '))
    const wa = await evalJs(`[...document.querySelectorAll('a')].find(a => /WhatsApp/.test(a.textContent) && a.closest('#comprar'))?.href`)
    check('WhatsApp e redes vêm das definições', wa === 'https://wa.me/message/5Z32NMOECZ27P1' && (await evalJs(`!!document.querySelector('footer a[href*="instagram.com/medique_lda"]')`)), wa)
    await shot('d-produto')
    check('sem erros de JavaScript na consola', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))
    throw Object.assign(new Error('fim'), { done: true })
  }

  /* ── 2. Compra de teste (computador) ── */
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false })
  await go('/produto/conjunto-scrub-medique?cor=azul-royal')
  const sizes = await evalJs(`[...document.querySelectorAll('#comprar button[aria-pressed]')].filter(b => b.textContent.trim()).map(b => b.textContent.trim() + (b.disabled ? '×' : ''))`)
  check('produto azul royal: só S, M, L disponíveis', JSON.stringify(sizes) === JSON.stringify(['XS×', 'S', 'M', 'L', 'XL×', 'XXL×']), sizes.join(' '))
  await click('#comprar button', 'S')
  await sleep(300)
  const stockTxt = await evalJs(`document.querySelector('#comprar [aria-live]').textContent`)
  check('mostra stock do tamanho S', /2 peças em stock/.test(stockTxt), stockTxt)
  // Tenta pôr 3 (só há 2): o botão + deve parar em 2
  await click('button[aria-label="Aumentar quantidade"]', '')
  await click('button[aria-label="Aumentar quantidade"]', '')
  const qty = await evalJs(`document.querySelector('#comprar [aria-live=polite].num, #comprar span.num')?.textContent`)
  check('quantidade limitada ao stock (máx. 2)', qty === '2', `quantidade=${qty}`)
  await click('#comprar button', /Adicionar ao carrinho/)
  await sleep(2300)
  const cart = await evalJs(`JSON.parse(localStorage.getItem('medique:cart') || '[]')`)
  check('carrinho tem 2× Azul Royal S', cart.length === 1 && cart[0].qty === 2 && cart[0].size === 'S', JSON.stringify(cart))
  const after = await evalJs(`document.querySelector('#comprar button.btn-primary')?.textContent`)
  check('depois de esgotar no carrinho, não deixa adicionar mais', /Sem mais stock/.test(after || ''), after)
  await shot('d-produto')

  await go('/checkout')
  await click('button[type=submit]', /Finalizar pelo WhatsApp/)
  await sleep(300)
  const errs = await evalJs(`document.querySelectorAll('[aria-invalid=true]').length`)
  check('checkout vazio mostra erros de validação', errs >= 4, `${errs} campos assinalados`)
  await fill('input[autocomplete=name]', 'Teste Automático')
  await fill('input[type=tel]', '84 123 4567')
  await fill('select', 'Maputo Cidade')
  await fill('input[autocomplete=address-level2]', 'Maputo')
  await fill('input[autocomplete=street-address]', 'Av. Teste, 100')
  await sleep(200)
  await shot('d-checkout')
  await click('button[type=submit]', /Finalizar pelo WhatsApp/)
  const done = await waitFor(`location.pathname.startsWith('/encomenda/')`, 10000)
  const orderNo = done ? await evalJs(`location.pathname.split('/').pop()`) : null
  check('encomenda registada', done, orderNo ? `nº ${orderNo}` : await evalJs('location.pathname'))
  await sleep(800)
  const waHref = await evalJs(`[...document.querySelectorAll('a')].find(a => /Enviar pelo WhatsApp/.test(a.textContent))?.href`)
  check('botão WhatsApp aponta para o link da MEDIQUE', waHref === 'https://wa.me/message/5Z32NMOECZ27P1', waHref)
  const msg = await evalJs(`document.querySelector('pre')?.textContent || ''`)
  check('mensagem da encomenda tem os artigos e a morada', /2× Conjunto Scrub MEDIQUE \| Azul Royal \| S/.test(msg) && /Av\. Teste, 100/.test(msg), msg.split('\n')[2])
  const cartAfter = await evalJs(`JSON.parse(localStorage.getItem('medique:cart') || '[]').length`)
  check('carrinho esvaziado', cartAfter === 0)
  await shot('d-encomenda')

  // Loja: Azul Royal S passou a esgotado
  await go('/produto/conjunto-scrub-medique?cor=azul-royal')
  const sizes2 = await evalJs(`[...document.querySelectorAll('#comprar button[aria-pressed]')].filter(b => b.textContent.trim()).map(b => b.textContent.trim() + (b.disabled ? '×' : ''))`)
  check('depois da compra, S fica esgotado na loja', sizes2[1] === 'S×', sizes2.join(' '))

  /* ── 3. Painel ── */
  await go('/admin')
  await fill('input[type=password]', 'medique')
  await click('button', 'Entrar')
  const inAdmin = await waitFor(`!!document.querySelector('nav[aria-label=Painel]')`, 8000)
  check('login no painel', inAdmin)
  await sleep(800)
  const kpi = await evalJs(`[...document.querySelectorAll('p')].find(p => p.textContent === 'Peças à venda')?.nextElementSibling?.textContent`)
  check('resumo: 32 peças à venda (34 − 2 vendidas)', kpi === '32', `valor=${kpi}`)
  await shot('d-admin-resumo')
  await go('/admin/encomendas')
  const listed = await evalJs(`document.body.innerText.includes('nº ${orderNo}') && document.body.innerText.includes('Teste Automático')`)
  check('encomenda aparece no painel', listed)
  // Cancelar devolve stock
  await click('button', new RegExp('nº ' + orderNo))
  await sleep(400)
  await fill('select', 'cancelada')
  await sleep(1500)
  await go('/admin')
  const kpi2 = await evalJs(`[...document.querySelectorAll('p')].find(p => p.textContent === 'Peças à venda')?.nextElementSibling?.textContent`)
  check('cancelar encomenda repõe o stock (34)', kpi2 === '34', `valor=${kpi2}`)
  // Aviso de encomenda nova: com o painel aberto, entra uma encomenda (aqui, escrita diretamente na base local).
  await evalJs(`new Promise((res, rej) => { const r = indexedDB.open('medique', 1); r.onsuccess = () => { const tx = r.result.transaction('kv', 'readwrite'); const st = tx.objectStore('kv'); const g = st.get('db:v1'); g.onsuccess = () => { const d = g.result; d.orders.unshift({ id: 'teste-aviso', number: 1999, createdAt: new Date().toISOString(), customer: { name: 'Aviso Teste', phone: '841234567' }, address: { province: 'Gaza', city: 'Xai-Xai', street: 'Rua 1' }, items: [], total: null, status: 'nova', channel: 'whatsapp' }); st.put(d, 'db:v1') }; tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error) } })`)
  const alerted = await waitFor(`/1999/.test(document.querySelector('[role=alert]')?.textContent || '')`, 45000)
  check('painel avisa quando chega encomenda nova', alerted, await evalJs(`document.querySelector('[role=alert]')?.innerText.replace(/\s+/g, ' ') || 'sem aviso'`))
  const badge = await evalJs(`document.querySelector('nav[aria-label=Painel] [aria-label$="por tratar"]')?.textContent`)
  const title = await evalJs('document.title')
  check('contador no separador Encomendas e no título', badge === '1' && title.startsWith('(1)'), `contador=${badge} · título="${title}"`)
  await shot('d-admin-aviso')
  await go('/admin/stock')
  await shot('d-admin-stock')
  const filters = await evalJs(`document.body.innerText.includes('Scrubs femininos')`)
  await go('/loja/feminino')
  const fem = await evalJs(`document.querySelectorAll('article').length`)
  check('categoria Scrubs femininos tem produtos', fem > 0, `${fem} cartões`)

  check('sem erros de JavaScript na consola', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))
  void filters
} catch (e) {
  if (!e.done) check('execução do teste', false, e.message)
} finally {
  // Pede ao Edge que se feche (fecha todos os seus processos); senão fica aberto em segundo plano.
  try {
    await Promise.race([send('Browser.close'), sleep(3000)])
  } catch {
    /* já fechado */
  }
  ws?.close()
  await sleep(500)
  spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'])
  const failed = results.filter((r) => !r.ok).length
  console.log(`\n${results.length - failed}/${results.length} verificações passaram`)
  process.exit(failed ? 1 : 0)
}

# MEDIQUE · Loja online

Loja da MEDIQUE feita com React, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber e Supabase.

## Abrir no computador

```bash
npm install
npm run dev
```

Depois abra o endereço que aparece no terminal (normalmente http://localhost:5173).

- Loja: `/`
- Painel de administração: `/admin`

> O Live Server do VS Code **não** serve para esta loja. Ela tem de ser aberta com `npm run dev`
> (para testar) ou publicada a partir da pasta `dist` (ver mais abaixo).

## Modo local e modo Supabase

**Sem Supabase (modo local):** a loja funciona logo, com o stock inicial de 35 uniformes.
Tudo o que mudar no painel, e as encomendas de teste, ficam guardados **só nesse navegador**.
A palavra-passe do painel é `medique` (pode mudar em `.env`, `VITE_LOCAL_ADMIN_PASSWORD`).
Serve para testar e mostrar; não serve para clientes reais.

**Com Supabase (produção):** stock, encomendas e fotografias ficam na nuvem, partilhados por todos.

### Ligar o Supabase

1. Crie um projeto em https://supabase.com.
2. No **SQL Editor**, corra `supabase/schema.sql` e depois `supabase/seed.sql`.
3. Em **Authentication → Users**, crie o utilizador da equipa (email + palavra-passe).
4. No SQL Editor, dê-lhe acesso ao painel:
   ```sql
   insert into admins (user_id) values ('<id do utilizador>');
   ```
5. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (em **Project Settings → API**).
6. Reinicie `npm run dev`. O painel passa a pedir email e palavra-passe.

## O que o painel faz

- **Resumo:** peças à venda, encomendas, receita, stock por tamanho, esgotados e últimas peças.
- **Encomendas:** ver detalhes, contactar o cliente pelo WhatsApp e mudar o estado.
  Cancelar devolve as peças ao stock.
- **Produtos:** criar e editar produtos, preço em MZN, categorias, cores, fotografias
  (frente, costas e detalhes), stock por tamanho e modelo 3D (.glb).
- **Stock:** tabela rápida com todas as cores e tamanhos, e um filtro para ver só os esgotados.
- **Cores:** acrescentar e editar as cores da coleção.
- **Definições:** número de WhatsApp, email, Instagram, Facebook e lista de tamanhos.

## Regras de stock

- A loja só mostra cores com stock e só deixa escolher tamanhos disponíveis.
- A quantidade nunca passa do stock existente (incluindo o que já está no carrinho).
- Ao finalizar, a encomenda **reserva** as peças (o stock desce logo). No Supabase isto é feito
  numa só transação no servidor (`place_order`), por isso dois clientes não compram a mesma última peça.
- A coluna **A confirmar** guarda peças do inventário interno que não estão à venda
  (ex.: o pink com tamanho por confirmar). Quando souber o tamanho, passe-a para a coluna certa no painel.

## Fotografias e 3D

- Sem fotografia, cada cor mostra uma ilustração provisória marcada como “Ilustração · foto em breve”.
  Assim que carregar as fotos reais no painel (Produtos → cor → Foto frente / Foto costas), elas substituem a ilustração.
- O visualizador 360° aparece quando o produto tem um modelo `.glb`. Os materiais com nomes como
  `fabric`, `tecido`, `scrub` ou `cloth` recebem a cor escolhida; se nenhum tiver esses nomes, todo o modelo é pintado.
- As fotografias da campanha (topo da página inicial) estão na lista `CAMPAIGN` em `src/pages/Home.tsx`
  e os ficheiros em `public/produtos/`.

## Pagamentos

Hoje a encomenda é finalizada pelo WhatsApp. O ficheiro `src/lib/payments.ts` é o ponto para
acrescentar M-Pesa, e-Mola ou cartão no futuro (normalmente através de uma Edge Function do Supabase).

## Testar a loja automaticamente

Com a loja compilada e a correr (`npm run build` e depois `npx vite preview --port 4175`), num segundo terminal:

```bash
npm run test:e2e
```

O teste abre o Edge sem janela e verifica, sozinho: a versão de telemóvel (390 px) sem conteúdo cortado,
que só aparecem tamanhos em stock, que a quantidade não passa do stock, uma compra completa até à mensagem
do WhatsApp, e no painel que o stock desce com a encomenda e volta a subir quando ela é cancelada.
Para guardar capturas de ecrã, defina `OUT=<pasta>` antes do comando.

## Publicar

```bash
npm run build
```

O site fica na pasta `dist`. Pode publicá-lo na Vercel, Netlify ou Cloudflare Pages.
Configure o redirecionamento de todas as rotas para `index.html` (as páginas como `/loja` precisam disso)
e defina as mesmas variáveis do `.env` no serviço de alojamento.

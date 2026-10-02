import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import hero from '../assets/hero.jpg'
import { SizeTable } from '../components/SizeTable'
import { WhatsappIcon } from '../components/icons'
import { isWaUrl, waLink } from '../lib/format'
import { useSeo } from '../lib/seo'
import { useCatalog } from '../state/catalog'

function Page({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="wrap max-w-4xl pt-12 pb-24 md:pt-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-display text-5xl text-navy md:text-6xl">{title}</h1>
      <div className="mt-10 grid gap-6 text-[15px] leading-relaxed text-muted [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-navy">
        {children}
      </div>
    </div>
  )
}

export function About() {
  useSeo('Sobre nós', 'A MEDIQUE veste profissionais de saúde em Moçambique. Cuidamos de quem cuida.')
  return (
    <div className="pb-24">
      <div className="wrap grid gap-10 pt-12 md:grid-cols-2 md:items-center md:pt-16">
        <div>
          <p className="eyebrow">Sobre nós</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.05] text-navy md:text-6xl">Cuidamos de quem cuida.</h1>
          <p className="mt-6 max-w-md leading-relaxed text-muted">
            A MEDIQUE nasceu para vestir médicos, enfermeiros e equipas de saúde em Moçambique com uniformes que juntam estilo,
            conforto e profissionalismo.
          </p>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Acreditamos que quem passa o dia a cuidar dos outros merece sentir-se bem no que veste, do início ao fim do turno.
          </p>
          <Link to="/loja" className="btn-primary mt-8">
            Ver a coleção
          </Link>
        </div>
        <div className="aspect-[4/4.4] overflow-hidden rounded-t-full rounded-b-3xl bg-beige">
          <img src={hero} alt="Profissionais de saúde com uniformes MEDIQUE" className="h-full w-full object-cover object-top" loading="lazy" />
        </div>
      </div>
    </div>
  )
}

export function SizeGuide() {
  useSeo('Guia de tamanhos', 'Tabela de medidas dos uniformes MEDIQUE.')
  return (
    <Page eyebrow="Guia de tamanhos" title="Encontre o seu tamanho">
      <p>
        Meça o peito na parte mais larga e a cintura na parte mais fina, com a fita justa mas sem apertar. Se ficar entre dois
        tamanhos, escolha o maior.
      </p>
      <SizeTable />
      <p className="text-sm">Medidas do corpo em centímetros, orientativas. Em caso de dúvida, fale connosco antes de encomendar.</p>
    </Page>
  )
}

export function Contact() {
  useSeo('Contactos')
  const { settings: s } = useCatalog()
  const items = [
    { label: 'WhatsApp', value: s.whatsapp ? (isWaUrl(s.whatsapp) ? 'Abrir conversa' : s.whatsapp) : '', href: s.whatsapp ? waLink(s.whatsapp, 'Olá MEDIQUE!') : '' },
    { label: 'Email', value: s.email, href: '' },
    { label: 'Instagram', value: s.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, ''), href: s.instagram },
    { label: 'Facebook', value: s.facebook ? 'MEDIQUE no Facebook' : '', href: s.facebook },
    { label: 'TikTok', value: s.tiktok.replace(/^https?:\/\/(www\.)?tiktok\.com\//, ''), href: s.tiktok },
    { label: 'X', value: s.x.replace(/^https?:\/\/(www\.)?x\.com\//, '@'), href: s.x },
  ]
  return (
    <Page eyebrow="Contactos" title="Fale connosco">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.label} className="rounded-2xl border border-line p-6">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase">{i.label}</p>
            {i.value ? (
              i.href ? (
                <a href={i.href} target="_blank" rel="noopener noreferrer" className="mt-2 block font-display text-2xl break-words text-navy">
                  {i.value}
                </a>
              ) : (
                <p className="mt-2 font-display text-2xl break-words text-navy select-all">{i.value}</p>
              )
            ) : (
              <p className="mt-2 text-sm">Em breve</p>
            )}
          </div>
        ))}
      </div>
      {s.whatsapp && (
        <a href={waLink(s.whatsapp, 'Olá MEDIQUE!')} target="_blank" rel="noopener noreferrer" className="btn w-fit bg-[#1F9E5B] text-white">
          <WhatsappIcon /> Conversar no WhatsApp
        </a>
      )}
    </Page>
  )
}

export function Privacy() {
  useSeo('Política de privacidade')
  return (
    <Page eyebrow="Informação" title="Política de privacidade">
      <p>
        Esta página descreve como a MEDIQUE trata os dados que nos dá ao fazer uma encomenda no site. O texto final deve ser revisto
        pela MEDIQUE antes da publicação.
      </p>
      <h2>Que dados recolhemos</h2>
      <p>Nome, telefone, email (opcional) e morada de entrega, indicados por si no formulário de encomenda.</p>
      <h2>Para que os usamos</h2>
      <p>Apenas para confirmar, preparar e entregar a sua encomenda e para falar consigo sobre ela.</p>
      <h2>Partilha</h2>
      <p>Não vendemos os seus dados. Só os partilhamos com quem precisa deles para entregar a encomenda.</p>
      <h2>Os seus direitos</h2>
      <p>Pode pedir-nos a qualquer momento para consultar, corrigir ou apagar os seus dados, através dos nossos contactos.</p>
    </Page>
  )
}

export function Terms() {
  useSeo('Termos e condições')
  return (
    <Page eyebrow="Informação" title="Termos e condições">
      <p>
        Estes termos regulam as compras feitas no site da MEDIQUE. O texto final deve ser revisto pela MEDIQUE antes da publicação.
      </p>
      <h2>Encomendas</h2>
      <p>
        Uma encomenda feita no site reserva as peças escolhidas. A venda fica concluída depois de a MEDIQUE confirmar consigo o
        valor, o pagamento e a entrega.
      </p>
      <h2>Preços</h2>
      <p>Os preços são apresentados em Meticais (MZN). Quando um preço aparece como “sob consulta”, é confirmado antes do pagamento.</p>
      <h2>Stock</h2>
      <p>O site mostra apenas cores e tamanhos disponíveis. Se uma peça esgotar entretanto, avisamos antes de qualquer pagamento.</p>
    </Page>
  )
}

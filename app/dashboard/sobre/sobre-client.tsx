"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  version: string;
}

type Tab = "inicio" | "voluntarios" | "escalas" | "notificacoes" | "administracao";

const TABS: { id: Tab; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "voluntarios", label: "Voluntarios" },
  { id: "escalas", label: "Escalas" },
  { id: "notificacoes", label: "Notificacoes" },
  { id: "administracao", label: "Admin" },
];

export function SobreClient({ version }: Props) {
  const [tab, setTab] = useState<Tab>("inicio");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Como usar o Escalas
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Guia rapido para gerenciar suas escalas de voluntarios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            v{version}
          </span>
          <Link
            href="/dashboard"
            className="w-fit rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {tab === "inicio" && <InicioTab />}
        {tab === "voluntarios" && <VoluntariosTab />}
        {tab === "escalas" && <EscalasTab />}
        {tab === "notificacoes" && <NotificacoesTab />}
        {tab === "administracao" && <AdministracaoTab />}
      </div>

      {/* Suporte */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          Ficou com alguma duvida ou precisa de ajuda?
        </p>
        <a
          href="https://wa.me/5522988516223?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20Escalas"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Falar com o suporte
        </a>
      </div>
    </div>
  );
}

/* ─── Componentes auxiliares ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{children}</h2>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
        {number}
      </div>
      <div className="flex-1 pb-6">
        <h3 className="font-medium text-slate-900 dark:text-slate-100">{title}</h3>
        <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{children}</div>
      </div>
    </div>
  );
}

function ExampleBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
        {title}
      </p>
      <div className="text-sm text-indigo-900 dark:text-indigo-200">{children}</div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
      <strong>Dica:</strong> {children}
    </div>
  );
}

/* ─── Tabs ─── */

function InicioTab() {
  return (
    <div className="p-6">
      <SectionTitle>Bem-vindo ao Escalas</SectionTitle>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        O Escalas ajuda voce a organizar os voluntarios da sua igreja em cultos e eventos.
        Com ele voce cadastra voluntarios, cria escalas e notifica todos pelo WhatsApp de forma automatica.
      </p>

      <h3 className="mb-4 font-medium text-slate-900 dark:text-slate-100">Fluxo basico de uso</h3>
      <div className="space-y-1">
        <Step number={1} title="Cadastre seus voluntarios">
          Adicione o nome e telefone de cada voluntario na aba <strong>Voluntarios</strong>.
        </Step>
        <Step number={2} title="Crie um culto/evento">
          Na aba <strong>Escalas</strong>, clique em <strong>Nova Escala</strong> para criar um culto com data e horario.
        </Step>
        <Step number={3} title="Escale os voluntarios">
          Adicione voluntarios ao culto com suas respectivas funcoes.
        </Step>
        <Step number={4} title="Notifique pelo WhatsApp">
          Envie a notificacao para cada voluntario. Ele recebe um link para confirmar ou informar que nao podera ir.
        </Step>
        <Step number={5} title="Acompanhe as respostas">
          Veja em tempo real quem confirmou, recusou ou ainda esta pendente.
        </Step>
      </div>

      <Tip>
        O painel principal tem 4 abas: <strong>Escalas</strong>, <strong>Voluntarios</strong>,{" "}
        <strong>Relatorios</strong> e <strong>Administracao</strong>. Use o menu no topo para navegar.
      </Tip>
    </div>
  );
}

function VoluntariosTab() {
  return (
    <div className="p-6">
      <SectionTitle>Gerenciando Voluntarios</SectionTitle>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Voluntarios sao as pessoas que servem nos cultos e eventos da sua igreja.
      </p>

      <h3 className="mb-4 font-medium text-slate-900 dark:text-slate-100">Como cadastrar</h3>
      <Step number={1} title="Clique em 'Novo Voluntario'">
        O botao fica no topo do painel, ao lado de &quot;Nova Escala&quot;.
      </Step>
      <Step number={2} title="Preencha os dados">
        Informe nome, telefone (com DDD) e opcionalmente o email.
      </Step>

      <ExampleBox title="Exemplo de preenchimento">
        <div className="space-y-1">
          <p><strong>Nome:</strong> Maria Silva</p>
          <p><strong>Telefone:</strong> 11999887766</p>
          <p><strong>Email:</strong> maria@email.com <span className="text-indigo-500">(opcional)</span></p>
        </div>
      </ExampleBox>

      <h3 className="mb-4 mt-6 font-medium text-slate-900 dark:text-slate-100">Editando e removendo</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Na aba <strong>Voluntarios</strong>, clique no icone de edicao ao lado do nome para alterar os dados.
        Para remover, use o botao de exclusao. Voluntarios com escalas futuras nao podem ser removidos.
      </p>

      <Tip>
        O telefone deve conter DDD + numero, sem espacos ou tracos. Exemplo: <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">11999887766</code>
      </Tip>
    </div>
  );
}

function EscalasTab() {
  return (
    <div className="p-6">
      <SectionTitle>Criando Escalas</SectionTitle>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Uma escala vincula voluntarios a um culto ou evento, com funcao especifica e status de confirmacao.
      </p>

      <h3 className="mb-4 font-medium text-slate-900 dark:text-slate-100">Criando um culto com escala</h3>
      <Step number={1} title="Clique em 'Nova Escala'">
        O botao fica no topo do painel.
      </Step>
      <Step number={2} title="Preencha o titulo do culto">
        Use um nome claro para identificar o evento.
      </Step>
      <Step number={3} title="Escolha data e horario">
        Selecione quando o culto vai acontecer.
      </Step>
      <Step number={4} title="Selecione o primeiro voluntario e sua funcao">
        Voce pode adicionar mais voluntarios depois.
      </Step>

      <ExampleBox title="Exemplo de preenchimento">
        <div className="space-y-1">
          <p><strong>Titulo:</strong> Culto de Domingo</p>
          <p><strong>Data/Hora:</strong> 29/09/2026 as 19:00</p>
          <p><strong>Voluntario:</strong> Joao Santos</p>
          <p><strong>Funcao:</strong> Guitarra</p>
        </div>
      </ExampleBox>

      <h3 className="mb-4 mt-6 font-medium text-slate-900 dark:text-slate-100">Adicionando mais voluntarios</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Dentro do card do culto, clique no botao <strong>+</strong> para adicionar outro voluntario.
        Cada um pode ter uma funcao diferente.
      </p>

      <ExampleBox title="Exemplo de funcoes">
        <div className="flex flex-wrap gap-2">
          {["Guitarra", "Bateria", "Teclado", "Baixo", "Vocal", "Sonoplastia", "Projecao", "Recepcao", "Diacono", "Intercessao"].map((f) => (
            <span key={f} className="rounded-full bg-indigo-200 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200">
              {f}
            </span>
          ))}
        </div>
      </ExampleBox>

      <h3 className="mb-4 mt-6 font-medium text-slate-900 dark:text-slate-100">Status da escala</h3>
      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" />
          <strong>Pendente</strong> — voluntario ainda nao respondeu
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          <strong>Confirmado</strong> — voluntario confirmou presenca
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
          <strong>Nao poderei</strong> — voluntario informou que nao podera comparecer
        </div>
      </div>

      <Tip>
        Use os filtros de status e busca na aba Escalas para encontrar rapidamente um culto ou voluntario.
      </Tip>
    </div>
  );
}

function NotificacoesTab() {
  return (
    <div className="p-6">
      <SectionTitle>Notificacoes via WhatsApp</SectionTitle>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        O sistema envia mensagens automaticas via WhatsApp para os voluntarios escalados.
      </p>

      <h3 className="mb-4 font-medium text-slate-900 dark:text-slate-100">Como funciona</h3>
      <Step number={1} title="Escale o voluntario">
        Adicione ele ao culto com a funcao desejada.
      </Step>
      <Step number={2} title="Clique no icone de envio">
        No card do culto, clique no icone de envio ao lado do nome do voluntario.
      </Step>
      <Step number={3} title="Voluntario recebe a mensagem">
        Ele recebe no WhatsApp os detalhes do culto e um link para confirmar ou avisar que nao podera ir.
      </Step>

      <ExampleBox title="Exemplo de mensagem que o voluntario recebe">
        <div className="whitespace-pre-line font-mono text-xs leading-relaxed">
{`Igreja Vida Nova

Ola, Maria Silva!

Voce foi escalado(a) para o culto:
Culto de Domingo
Data/Hora: dom., 29/09, 19:00
Funcao: Guitarra

Por favor, confirme sua presenca ou avise
se nao podera ir pelo link abaixo:
[link de confirmacao]

Contamos com voce! Deus abencoe.`}
        </div>
      </ExampleBox>

      <h3 className="mb-4 mt-6 font-medium text-slate-900 dark:text-slate-100">Quando alguem nao pode ir</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Se um voluntario informar que nao podera comparecer, voce (ou o lider do ministerio) recebe
        automaticamente um aviso no WhatsApp com o nome, o motivo e qual funcao precisa de substituto.
      </p>

      <Tip>
        Voce pode enviar a notificacao para todos os voluntarios do culto de uma vez usando o botao
        de envio em massa no card do culto.
      </Tip>
    </div>
  );
}

function AdministracaoTab() {
  return (
    <div className="p-6">
      <SectionTitle>Administracao</SectionTitle>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Na aba Administracao voce configura ministerios e cadastra lideres que terao acesso ao painel.
      </p>

      <h3 className="mb-4 font-medium text-slate-900 dark:text-slate-100">Ministerios</h3>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
        Ministerios sao os departamentos da igreja. Cada ministerio pode ter seus proprios voluntarios e escalas.
      </p>

      <ExampleBox title="Exemplos de ministerios">
        <div className="flex flex-wrap gap-2">
          {["Louvor", "Infantil", "Midia", "Recepcao", "Intercessao", "Diaconia", "Jovens"].map((m) => (
            <span key={m} className="rounded-full bg-indigo-200 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200">
              {m}
            </span>
          ))}
        </div>
      </ExampleBox>

      <h3 className="mb-4 mt-6 font-medium text-slate-900 dark:text-slate-100">Lideres</h3>
      <Step number={1} title="Cadastre o lider">
        Informe nome, email, telefone e qual ministerio ele lidera.
      </Step>
      <Step number={2} title="Lider recebe acesso">
        Ao fazer login com o email cadastrado, o lider tera acesso apenas
        aos voluntarios e escalas do ministerio dele.
      </Step>

      <ExampleBox title="Exemplo de cadastro de lider">
        <div className="space-y-1">
          <p><strong>Nome:</strong> Pedro Oliveira</p>
          <p><strong>Email:</strong> pedro@email.com</p>
          <p><strong>Telefone:</strong> 11988776655</p>
          <p><strong>Ministerio:</strong> Louvor</p>
        </div>
      </ExampleBox>

      <h3 className="mb-4 mt-6 font-medium text-slate-900 dark:text-slate-100">Nome da Igreja</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        No topo do painel, clique no nome da igreja para edita-lo. Esse nome aparece nas mensagens
        enviadas aos voluntarios via WhatsApp.
      </p>

      <Tip>
        O lider so ve os voluntarios e escalas do ministerio dele. Voce, como administrador,
        ve tudo de todos os ministerios.
      </Tip>
    </div>
  );
}

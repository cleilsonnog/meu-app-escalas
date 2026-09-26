"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ListaEscalasFiltrada } from "./lista-escalas-filtrada";
import { TabelaVoluntarios } from "./tabela-voluntarios";
import { RelatoriosVoluntarios } from "../relatorios-voluntarios";
import { AdministracaoTab } from "./administracao-tab";

type TabId = "escalas" | "voluntarios" | "relatorios" | "administracao";

interface Props {
  tab: TabId;
  escalas: any[];
  voluntarios: any[];
  nomeIgreja?: string;
  administracao?: { ministries: any[]; leaders: any[]; schedules: any[] };
}

const tabStyle = (active: boolean) =>
  `px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition whitespace-nowrap ${
    active
      ? "bg-indigo-600 text-white shadow-sm"
      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
  }`;

export function DashboardTabs({
  tab,
  escalas,
  voluntarios,
  nomeIgreja,
  administracao,
}: Props) {
  const totalEventos = new Set(
    escalas.map((e) => e.eventId || e.event?.id || e.id),
  ).size;

  const totalEscalas = escalas.length;
  const confirmadas = escalas.filter((e) => e.status === "CONFIRMADO").length;
  const recusadas = escalas.filter((e) => e.status === "RECUSADO").length;
  const pendentes = escalas.filter(
    (e) => e.status === "PENDENTE" || !e.status,
  ).length;

  const taxaConfirmacao =
    totalEscalas > 0 ? Math.round((confirmadas / totalEscalas) * 100) : 0;
  const taxaRecusa =
    totalEscalas > 0 ? Math.round((recusadas / totalEscalas) * 100) : 0;

  const contagemPorVoluntario: Record<
    string,
    { nome: string; departamento: string; quantidade: number }
  > = {};

  escalas.forEach((e) => {
    const vId = e.volunteer?.id || e.volunteerId;
    const vNome = e.volunteer?.nome || "Voluntário";
    const vDept = e.volunteer?.departamento || "Geral";

    if (vId) {
      if (!contagemPorVoluntario[vId]) {
        contagemPorVoluntario[vId] = {
          nome: vNome,
          departamento: vDept,
          quantidade: 0,
        };
      }
      contagemPorVoluntario[vId].quantidade += 1;
    }
  });

  const voluntarioEscaladosUnicos = Object.keys(contagemPorVoluntario).length;
  const sobrecarregados = Object.values(contagemPorVoluntario)
    .filter((v) => v.quantidade >= 4)
    .sort((a, b) => b.quantidade - a.quantidade);

  const resumoRelatorio = {
    totalEscalas,
    confirmadas,
    recusadas,
    pendentes,
    taxaConfirmacao,
    taxaRecusa,
    totalVoluntariosCadastrados: voluntarios.length,
    voluntarioEscaladosUnicos,
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <Link href="/dashboard" className={tabStyle(tab === "escalas")}>
          Painel de Cultos/Eventos ({totalEventos})
        </Link>

        {administracao && (
          <Link
            href="/dashboard?tab=administracao"
            className={tabStyle(tab === "administracao")}
          >
            Administração
          </Link>
        )}

        <Link
          href="/dashboard?tab=voluntarios"
          className={tabStyle(tab === "voluntarios")}
        >
          Voluntários Cadastrados ({voluntarios.length})
        </Link>

        <Link
          href="/dashboard?tab=relatorios"
          className={tabStyle(tab === "relatorios")}
        >
          Relatórios & Desempenho
        </Link>
      </div>

      {tab === "escalas" && (
        <ListaEscalasFiltrada
          escalas={escalas}
          voluntarios={voluntarios}
          nomeIgreja={nomeIgreja}
        />
      )}

      {tab === "voluntarios" && (
        <TabelaVoluntarios voluntarios={voluntarios} />
      )}

      {tab === "relatorios" && (
        <RelatoriosVoluntarios
          resumo={resumoRelatorio}
          sobrecarregados={sobrecarregados}
        />
      )}

      {tab === "administracao" && administracao && (
        <AdministracaoTab {...administracao} />
      )}
    </div>
  );
}

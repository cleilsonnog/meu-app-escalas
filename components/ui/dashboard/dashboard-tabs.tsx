"use client";

import { useState } from "react";
import { ListaEscalasFiltrada } from "./lista-escalas-filtrada";
import { TabelaVoluntarios } from "./tabela-voluntarios";
import { RelatoriosVoluntarios } from "../../relatorios-voluntarios"; // 👈 Import da nova aba

interface Props {
  escalas: any[];
  voluntarios: any[];
  nomeIgreja?: string;
}

export function DashboardTabs({ escalas, voluntarios, nomeIgreja }: Props) {
  // 1. Atualizado para aceitar a 3ª aba 'relatorios'
  const [abaAtiva, setAbaAtiva] = useState<
    "escalas" | "voluntarios" | "relatorios"
  >("escalas");

  // 2. Cálculos Automáticos para o Relatório baseados nas props recebidas
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

  // Mapeamento de sobrecarga de voluntários (escalados 4+ vezes)
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
      {/* Seletor de Abas com rolagem horizontal no celular */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {/* ABA 1: ESCALAS */}
        <button
          onClick={() => setAbaAtiva("escalas")}
          className={`px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition whitespace-nowrap ${
            abaAtiva === "escalas"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          📋 Painel de Escalas ({escalas.length})
        </button>

        {/* ABA 2: VOLUNTÁRIOS */}
        <button
          onClick={() => setAbaAtiva("voluntarios")}
          className={`px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition whitespace-nowrap ${
            abaAtiva === "voluntarios"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          👥 Voluntários ({voluntarios.length})
        </button>

        {/* 👈 ABA 3: RELATÓRIOS & DESEMPENHO */}
        <button
          onClick={() => setAbaAtiva("relatorios")}
          className={`px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition whitespace-nowrap ${
            abaAtiva === "relatorios"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          📊 Relatórios & Desempenho
        </button>
      </div>

      {/* Renderização Condicional da Aba Ativa */}
      {abaAtiva === "escalas" && (
        <ListaEscalasFiltrada
          escalas={escalas}
          voluntarios={voluntarios}
          nomeIgreja={nomeIgreja}
        />
      )}

      {abaAtiva === "voluntarios" && (
        <TabelaVoluntarios voluntarios={voluntarios} />
      )}

      {/* 👈 CONTEÚDO DA 3ª ABA */}
      {abaAtiva === "relatorios" && (
        <RelatoriosVoluntarios
          resumo={resumoRelatorio}
          sobrecarregados={sobrecarregados}
        />
      )}
    </div>
  );
}

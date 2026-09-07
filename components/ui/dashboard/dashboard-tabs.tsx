"use client";

import { useState } from "react";
import { ListaEscalasFiltrada } from "./lista-escalas-filtrada";
import { TabelaVoluntarios } from "./tabela-voluntarios";

interface Props {
  escalas: any[];
  voluntarios: any[];
}

export function DashboardTabs({ escalas, voluntarios }: Props) {
  const [abaAtiva, setAbaAtiva] = useState<"escalas" | "voluntarios">(
    "escalas",
  );

  return (
    <div className="space-y-6">
      {/* Seletor de Abas */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setAbaAtiva("escalas")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            abaAtiva === "escalas"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          📋 Painel de Escalas ({escalas.length})
        </button>

        <button
          onClick={() => setAbaAtiva("voluntarios")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            abaAtiva === "voluntarios"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          👥 Voluntários ({voluntarios.length})
        </button>
      </div>

      {/* Conteúdo da Aba */}
      {abaAtiva === "escalas" ? (
        <ListaEscalasFiltrada escalas={escalas} />
      ) : (
        <TabelaVoluntarios voluntarios={voluntarios} />
      )}
    </div>
  );
}

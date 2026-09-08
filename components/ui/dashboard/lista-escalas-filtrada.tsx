"use client";

import { useState } from "react";
import { EscalaCard } from "./escala-card";

interface ScheduleItem {
  id: string;
  eventId?: string;
  status: "PENDENTE" | "CONFIRMADO" | "RECUSADO";
  funcaoEspecífica?: string;
  funcaoEspecifica?: string;
  observacao?: string;
  volunteer?: {
    nome?: string;
    telefone?: string;
  };
  event?: {
    id?: string;
    titulo?: string;
    dataHora?: Date | string;
  };
}

interface VolunteerItem {
  id: string;
  nome: string;
  departamento?: string;
}

interface Props {
  escalas?: ScheduleItem[];
  voluntarios?: VolunteerItem[];
}

export function ListaEscalasFiltrada({
  escalas = [],
  voluntarios = [],
}: Props) {
  const [statusFiltro, setStatusFiltro] = useState<string>("TODOS");
  const [eventoFiltro, setEventoFiltro] = useState<string>("TODOS");
  const [busca, setBusca] = useState<string>("");

  // 1. Aplica os filtros na lista de escalas
  const escalasFiltradas = (escalas || []).filter((escala) => {
    if (!escala) return false;

    const atendeStatus =
      statusFiltro === "TODOS" || escala.status === statusFiltro;

    const tituloEvento = escala.event?.titulo || "";
    const atendeEvento =
      eventoFiltro === "TODOS" || tituloEvento === eventoFiltro;

    const nomeVoluntario = escala.volunteer?.nome || "";
    const funcao = escala.funcaoEspecífica || escala.funcaoEspecifica || "";

    const atendeBusca =
      busca === "" ||
      nomeVoluntario.toLowerCase().includes(busca.toLowerCase()) ||
      funcao.toLowerCase().includes(busca.toLowerCase());

    return atendeStatus && atendeEvento && atendeBusca;
  });

  // 2. Agrupa os resultados por EVENTO (Culto)
  const eventosAgrupadosMap = new Map<
    string,
    {
      eventId: string;
      eventoTitulo: string;
      dataHora: string;
      schedules: ScheduleItem[];
    }
  >();

  escalasFiltradas.forEach((escala) => {
    const eventId = escala.event?.id || escala.eventId || "evento-sem-id";
    const eventoTitulo = escala.event?.titulo || "Culto";
    const dataHora = escala.event?.dataHora
      ? new Date(escala.event.dataHora).toISOString()
      : new Date().toISOString();

    if (!eventosAgrupadosMap.has(eventId)) {
      eventosAgrupadosMap.set(eventId, {
        eventId,
        eventoTitulo,
        dataHora,
        schedules: [],
      });
    }

    eventosAgrupadosMap.get(eventId)?.schedules.push(escala);
  });

  // 3. Ordena os eventos cronologicamente (do mais próximo para o mais distante)
  const eventosOrdenados = Array.from(eventosAgrupadosMap.values()).sort(
    (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
  );

  // 4. Identifica o Próximo Culto (evento com data mais próxima do momento atual)
  const agora = new Date();
  const proximoCulto =
    eventosOrdenados.find(
      (e) =>
        new Date(e.dataHora).getTime() >= agora.getTime() - 3 * 60 * 60 * 1000, // Margem de 3 horas
    ) || eventosOrdenados[0];

  // Verifica se o usuário não está fazendo uma busca/filtro
  const semFiltrosAtivos =
    statusFiltro === "TODOS" && eventoFiltro === "TODOS" && busca === "";

  // Se não houver filtros, separa o próximo culto dos demais
  const demaisCultos =
    semFiltrosAtivos && proximoCulto
      ? eventosOrdenados.filter((e) => e.eventId !== proximoCulto.eventId)
      : eventosOrdenados;

  // Lista de títulos de cultos para o select de filtro
  const eventosUnicos = Array.from(
    new Set(
      (escalas || [])
        .map((e) => e.event?.titulo)
        .filter((titulo): titulo is string => Boolean(titulo)),
    ),
  );

  return (
    <div className="space-y-6">
      {/* ⚡ CARD EM DESTAQUE: PRÓXIMO CULTO (Visível quando não há filtros ativos) */}
      {semFiltrosAtivos && proximoCulto && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              ⚡ Próximo Culto em Destaque
            </h2>
          </div>

          <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 p-1 dark:border-emerald-500/30 dark:bg-emerald-950/10">
            <EscalaCard
              eventId={proximoCulto.eventId}
              eventoTitulo={proximoCulto.eventoTitulo}
              dataHora={proximoCulto.dataHora}
              schedules={proximoCulto.schedules}
              voluntarios={voluntarios}
            />
          </div>
        </div>
      )}

      {/* BARRA DE FILTROS E PESQUISA */}
      <div className="space-y-3">
        {semFiltrosAtivos && proximoCulto && (
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            📅 Demais Cultos ({demaisCultos.length})
          </h2>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Buscar por voluntário ou função..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="RECUSADO">Recusado</option>
          </select>

          <select
            value={eventoFiltro}
            onChange={(e) => setEventoFiltro(e.target.value)}
            className="h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="TODOS">Todos os Eventos</option>
            {eventosUnicos.map((titulo) => (
              <option key={titulo} value={titulo}>
                {titulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRID COM OS DEMAIS CULTOS */}
      {demaisCultos.length === 0 && !proximoCulto ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500">
            {escalas.length === 0
              ? "Nenhum culto ou escala cadastrada ainda."
              : "Nenhum culto encontrado com os filtros selecionados."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demaisCultos.map((grupo) => (
            <EscalaCard
              key={grupo.eventId}
              eventId={grupo.eventId}
              eventoTitulo={grupo.eventoTitulo}
              dataHora={grupo.dataHora}
              schedules={grupo.schedules}
              voluntarios={voluntarios}
            />
          ))}
        </div>
      )}
    </div>
  );
}

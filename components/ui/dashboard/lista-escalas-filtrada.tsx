"use client";

import { useState, useMemo } from "react";
import { EscalaCard } from "./escala-card";

interface ScheduleItem {
  id: string;
  status: "PENDENTE" | "CONFIRMADO" | "RECUSADO";
  funcaoEspecífica: string;
  volunteer: {
    nome: string;
    telefone: string;
  };
  event: {
    id: string;
    titulo: string;
    dataHora: Date | string;
  };
}

interface Props {
  escalas: ScheduleItem[];
}

export function ListaEscalasFiltrada({ escalas }: Props) {
  const [statusFiltro, setStatusFiltro] = useState<string>("TODOS");
  const [eventoFiltro, setEventoFiltro] = useState<string>("TODOS");
  const [busca, setBusca] = useState<string>("");

  // Identifica o próximo culto/evento mais próximo
  const proximoEvento = useMemo(() => {
    if (escalas.length === 0) return null;

    const agora = new Date();
    const eventosMap = new Map<
      string,
      { id: string; titulo: string; dataHora: Date }
    >();

    escalas.forEach((item) => {
      const d = new Date(item.event.dataHora);
      if (!eventosMap.has(item.event.id)) {
        eventosMap.set(item.event.id, {
          id: item.event.id,
          titulo: item.event.titulo,
          dataHora: d,
        });
      }
    });

    const listaEventos = Array.from(eventosMap.values());
    if (listaEventos.length === 0) return null;

    // Filtra eventos futuros (dataHora >= agora)
    const eventosFuturos = listaEventos.filter((e) => e.dataHora >= agora);

    if (eventosFuturos.length > 0) {
      // Ordena do mais próximo para o mais distante
      eventosFuturos.sort(
        (a, b) => a.dataHora.getTime() - b.dataHora.getTime(),
      );
      return eventosFuturos[0];
    }

    // Se não houver eventos futuros, pega o mais próximo em relação à data atual
    listaEventos.sort(
      (a, b) =>
        Math.abs(a.dataHora.getTime() - agora.getTime()) -
        Math.abs(b.dataHora.getTime() - agora.getTime()),
    );
    return listaEventos[0];
  }, [escalas]);

  // Formata a data do próximo evento (Ex: "domingo, 15 de outubro às 19:00")
  const dataProximoEventoFormatada = useMemo(() => {
    if (!proximoEvento) return "";
    return new Date(proximoEvento.dataHora).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [proximoEvento]);

  // Lista única de eventos/cultos para o dropdown
  const listaEventos = useMemo(() => {
    const eventosMap = new Map<string, string>();
    escalas.forEach((item) => {
      eventosMap.set(item.event.id, item.event.titulo);
    });
    return Array.from(eventosMap.entries()).map(([id, titulo]) => ({
      id,
      titulo,
    }));
  }, [escalas]);

  // Métricas numéricas
  const contadores = useMemo(() => {
    return {
      total: escalas.length,
      pendentes: escalas.filter((e) => e.status === "PENDENTE").length,
      confirmados: escalas.filter((e) => e.status === "CONFIRMADO").length,
      recusados: escalas.filter((e) => e.status === "RECUSADO").length,
    };
  }, [escalas]);

  // Filtragem combinada
  const escalasFiltradas = useMemo(() => {
    return escalas.filter((item) => {
      if (statusFiltro !== "TODOS" && item.status !== statusFiltro)
        return false;
      if (eventoFiltro !== "TODOS" && item.event.id !== eventoFiltro)
        return false;

      if (busca.trim() !== "") {
        const termo = busca.toLowerCase();
        const nomeMatch = item.volunteer.nome.toLowerCase().includes(termo);
        const funcaoMatch = item.funcaoEspecífica.toLowerCase().includes(termo);
        const eventoMatch = item.event.titulo.toLowerCase().includes(termo);

        if (!nomeMatch && !funcaoMatch && !eventoMatch) return false;
      }

      return true;
    });
  }, [escalas, statusFiltro, eventoFiltro, busca]);

  // Função para filtrar pelo próximo culto
  function filtrarPeloProximoEvento() {
    if (proximoEvento) {
      setEventoFiltro(proximoEvento.id);
      setStatusFiltro("TODOS");
      setBusca("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner de Destaque: PRÓXIMO CULTO */}
      {proximoEvento && (
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
              <span>📅 Próximo Culto</span>
            </div>
            <h2 className="text-2xl font-extrabold capitalize tracking-tight mt-1">
              {proximoEvento.titulo}
            </h2>
            <p className="text-indigo-100 text-sm font-medium capitalize">
              {dataProximoEventoFormatada}
            </p>
          </div>

          <button
            onClick={filtrarPeloProximoEvento}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${
              eventoFiltro === proximoEvento.id
                ? "bg-white text-indigo-900 ring-2 ring-white hover:bg-slate-100"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
            }`}
          >
            {eventoFiltro === proximoEvento.id
              ? "✓ Filtro Ativo"
              : "Ver escalação deste culto →"}
          </button>
        </div>
      )}

      {/* Cards de Métricas / Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFiltro("TODOS")}
          className={`p-4 rounded-xl border text-left transition ${
            statusFiltro === "TODOS"
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <span className="text-xs text-muted-foreground font-medium block">
            Total de Escalas
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {contadores.total}
          </span>
        </button>

        <button
          onClick={() => setStatusFiltro("PENDENTE")}
          className={`p-4 rounded-xl border text-left transition ${
            statusFiltro === "PENDENTE"
              ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium block">
            ⏳ Pendentes
          </span>
          <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {contadores.pendentes}
          </span>
        </button>

        <button
          onClick={() => setStatusFiltro("CONFIRMADO")}
          className={`p-4 rounded-xl border text-left transition ${
            statusFiltro === "CONFIRMADO"
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block">
            ✅ Confirmadas
          </span>
          <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {contadores.confirmados}
          </span>
        </button>

        <button
          onClick={() => setStatusFiltro("RECUSADO")}
          className={`p-4 rounded-xl border text-left transition ${
            statusFiltro === "RECUSADO"
              ? "border-red-500 bg-red-50/50 dark:bg-red-950/30 ring-2 ring-red-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <span className="text-xs text-red-600 dark:text-red-400 font-medium block">
            ❌ Recusadas
          </span>
          <span className="text-2xl font-bold text-red-700 dark:text-red-300">
            {contadores.recusados}
          </span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar voluntário ou função..."
            className="w-full px-3 py-2 text-sm border rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Select por Culto / Evento */}
          <select
            value={eventoFiltro}
            onChange={(e) => setEventoFiltro(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="TODOS">Todos os Cultos</option>
            {listaEventos.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.titulo}
              </option>
            ))}
          </select>

          {/* Select por Status */}
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE">Apenas Pendentes</option>
            <option value="CONFIRMADO">Apenas Confirmados</option>
            <option value="RECUSADO">Apenas Recusados</option>
          </select>

          {(statusFiltro !== "TODOS" ||
            eventoFiltro !== "TODOS" ||
            busca !== "") && (
            <button
              onClick={() => {
                setStatusFiltro("TODOS");
                setEventoFiltro("TODOS");
                setBusca("");
              }}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de Cards Filtrados */}
      {escalasFiltradas.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl bg-white/50 dark:bg-slate-900/50">
          <p className="text-muted-foreground text-sm">
            Nenhuma escala encontrada com os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {escalasFiltradas.map((escala) => (
            <EscalaCard
              key={escala.id}
              id={escala.id}
              nome={escala.volunteer.nome}
              telefone={escala.volunteer.telefone}
              eventoTitulo={escala.event.titulo}
              funcao={escala.funcaoEspecífica}
              dataHora={
                typeof escala.event.dataHora === "string"
                  ? escala.event.dataHora
                  : escala.event.dataHora.toISOString()
              }
              status={
                escala.status === "CONFIRMADO"
                  ? "Confirmado"
                  : escala.status === "RECUSADO"
                    ? "Recusado"
                    : "Pendente"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

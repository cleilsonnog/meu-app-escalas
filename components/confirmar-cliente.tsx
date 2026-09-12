"use client";

import { useState } from "react";
import { responderEscala } from "@/app/actions/escalas";
import { Loader2 } from "lucide-react";

interface Props {
  scheduleId: string;
  token?: string;
  statusInicial: string;
  observacaoInicial: string;
  eventoTitulo: string;
  dataHora?: Date | string;
  nomeVoluntario: string;
  funcao: string;
  departamento: string;
  nomeIgreja?: string; // Adicionado para exibir o nome da igreja/ministério
}

export function ConfirmarCliente({
  scheduleId,
  token,
  statusInicial,
  observacaoInicial,
  eventoTitulo,
  dataHora,
  nomeVoluntario,
  funcao,
  departamento,
  nomeIgreja, // Recebido como prop
}: Props) {
  const [observacao, setObservacao] = useState(observacaoInicial);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(statusInicial);
  const [modoEdicao, setModoEdicao] = useState(false);

  // Formata a data (Ex: Domingo, 13 de Setembro de 2026 às 08:00)
  const dataFormatada = dataHora
    ? new Date(dataHora).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const dataCapitalizada = dataFormatada
    ? dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)
    : "";

  async function handleResposta(novoStatus: "CONFIRMADO" | "RECUSADO") {
    setLoading(true);
    const res = await responderEscala(
      scheduleId,
      novoStatus,
      observacao,
      token,
    );
    setLoading(false);

    if (res.success) {
      setStatus(novoStatus);
    } else {
      alert("Erro ao salvar sua resposta. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5 text-slate-800 dark:text-slate-100">
        {/* CABEÇALHO DA FOTO */}
        <div className="text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400">
            CONFIRMAÇÃO DE ESCALA
          </span>
          {/* 👈 3. Nome da Igreja/Ministério em destaque */}
          {nomeIgreja && (
            <h1 className="text-2xl font-bold text-slate-900">{nomeIgreja}</h1>
          )}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 capitalize">
            {eventoTitulo}
          </h1>
          {dataCapitalizada && (
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {dataCapitalizada}
            </p>
          )}
        </div>

        {/* DETALHES DO VOLUNTÁRIO */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <p>
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              Voluntário:
            </strong>{" "}
            {nomeVoluntario}
          </p>
          <p>
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              Função:
            </strong>{" "}
            {funcao}
          </p>
          <p>
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              Departamento:
            </strong>{" "}
            {departamento}
          </p>
        </div>

        {/* CAMPO DE OBSERVAÇÃO E BOTÕES DE AÇÃO */}
        {status === "PENDENTE" || modoEdicao ? (
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observação{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                rows={2}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Tive um imprevisto / estou viajando..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  handleResposta("CONFIRMADO");
                  setModoEdicao(false);
                }}
                disabled={loading}
                className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirmar Presença"
                )}
              </button>

              <button
                onClick={() => {
                  handleResposta("RECUSADO");
                  setModoEdicao(false);
                }}
                disabled={loading}
                className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : modoEdicao ? (
                  "Avisar Imprevisto"
                ) : (
                  "Recusar"
                )}
              </button>
            </div>

            {modoEdicao && (
              <button
                type="button"
                onClick={() => setModoEdicao(false)}
                className="w-full text-xs text-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pt-1"
              >
                Cancelar alteração
              </button>
            )}
          </div>
        ) : status === "CONFIRMADO" ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-1">
              <p className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1">
                ✅ Presença Confirmada!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Obrigado por servir! A liderança já foi notificada.
              </p>
              {observacao && (
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 italic pt-1">
                  Obs: "{observacao}"
                </p>
              )}
            </div>

            {/* Botão para reabrir os campos e registrar imprevisto */}
            <button
              type="button"
              onClick={() => setModoEdicao(true)}
              className="w-full py-3.5 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border-2 border-amber-300/80 dark:border-amber-700/60 rounded-2xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
            >
              <span className="text-base">⚠️</span>
              <span>
                Teve algum imprevisto?{" "}
                <strong className="font-bold underline decoration-amber-500 underline-offset-2">
                  Clique para avisar a liderança
                </strong>
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-4 border border-red-200 dark:border-red-900/50 text-center space-y-1">
              <p className="font-bold text-sm text-red-800 dark:text-red-300 flex items-center justify-center gap-1">
                ❌ Escala Recusada
              </p>
              <p className="text-xs text-red-700 dark:text-red-400">
                Sua resposta foi registrada. A liderança já foi notificada.
              </p>
              {observacao && (
                <p className="text-[11px] text-red-800/80 dark:text-red-400/80 italic pt-1">
                  Obs: "{observacao}"
                </p>
              )}
            </div>

            {/* Opção para mudar de ideia se tiver recusado antes */}
            <button
              type="button"
              onClick={() => setModoEdicao(true)}
              className="w-full text-xs text-center text-slate-500 hover:text-emerald-600 underline transition py-1"
            >
              Mudou de ideia? Clique aqui para alterar a resposta.
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

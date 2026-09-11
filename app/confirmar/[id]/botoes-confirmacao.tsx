"use client";

import { useState } from "react";
import { responderEscala } from "@/app/actions/escalas";

interface Props {
  escalaId: string;
  statusAtual: "PENDENTE" | "CONFIRMADO" | "RECUSADO";
  observacaoAtual?: string;
}

export function BotoesConfirmacao({
  escalaId,
  statusAtual,
  observacaoAtual = "",
}: Props) {
  const [status, setStatus] = useState(statusAtual);
  const [observacao, setObservacao] = useState(observacaoAtual);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResposta(
    novoStatus: "CONFIRMADO" | "RECUSADO",
    textoObservacao?: string,
  ) {
    setLoading(true);
    const obsFinal =
      textoObservacao !== undefined ? textoObservacao : observacao;

    const result = await responderEscala(escalaId, novoStatus, obsFinal);

    if (result.success) {
      setStatus(novoStatus);
      setModoEdicao(false);
    }
    setLoading(false);
  }

  // 1. Já está CONFIRMADO (e não clicou para editar/informar imprevisto)
  if (status === "CONFIRMADO" && !modoEdicao) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200">
          <p className="font-semibold text-lg">✅ Presença Confirmada!</p>
          <p className="text-xs mt-1">
            Obrigado por servir! A liderança já foi notificada.
          </p>
        </div>

        <button
          onClick={() => setModoEdicao(true)}
          className="w-full text-xs text-center text-slate-500 hover:text-red-600 underline transition py-1"
        >
          Teve algum imprevisto de última hora? Clique aqui para avisar.
        </button>
      </div>
    );
  }

  // 2. Já está RECUSADO (e não clicou para alterar)
  if (status === "RECUSADO" && !modoEdicao) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg border border-red-200">
          <p className="font-semibold text-lg">❌ Escala Recusada</p>
          <p className="text-xs mt-1">
            Registramos que você não poderá ir. A liderança foi notificada!
          </p>
          {observacao && (
            <p className="text-xs italic mt-2 text-red-600 dark:text-red-300">
              Motivo: "{observacao}"
            </p>
          )}
        </div>

        <button
          onClick={() => handleResposta("CONFIRMADO", "")}
          disabled={loading}
          className="w-full text-xs text-center text-slate-500 hover:text-green-600 underline transition py-1"
        >
          Mudei de ideia, agora posso ir! Confirmar presença.
        </button>
      </div>
    );
  }

  // 3. Se clicou para avisar AUSÊNCIA / IMPREVISTO (Abre a caixinha de texto)
  if (modoEdicao) {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Qual o motivo do imprevisto ou ausência?
          </label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Tive um imprevisto de trabalho, vou viajar, etc..."
            rows={3}
            className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-400 outline-none resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleResposta("RECUSADO")}
            disabled={loading}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50 text-sm"
          >
            {loading ? "Enviando..." : "Confirmar Ausência e Avisar Líder"}
          </button>

          <button
            onClick={() => setModoEdicao(false)}
            disabled={loading}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // 4. PRIMEIRA VEZ (PENDENTE): Tela 100% limpa com 2 botões diretos
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
        Por favor, confirme se poderá servir neste dia:
      </p>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => handleResposta("CONFIRMADO", "")}
          disabled={loading}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50 shadow-sm"
        >
          {loading ? "Salvando..." : "Sim, confirmo minha presença"}
        </button>

        <button
          onClick={() => setModoEdicao(true)}
          disabled={loading}
          className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition text-sm"
        >
          Não poderei ir / Informar imprevisto
        </button>
      </div>
    </div>
  );
}

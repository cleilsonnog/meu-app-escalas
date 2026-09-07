"use client";

import { useState } from "react";
import { responderEscala } from "@/app/actions/escalas";

interface Props {
  escalaId: string;
  statusAtual: "PENDENTE" | "CONFIRMADO" | "RECUSADO";
}

export function BotoesConfirmacao({ escalaId, statusAtual }: Props) {
  const [status, setStatus] = useState(statusAtual);
  const [loading, setLoading] = useState(false);

  async function handleResposta(novoStatus: "CONFIRMADO" | "RECUSADO") {
    setLoading(true);
    const result = await responderEscala(escalaId, novoStatus);
    if (result.success) {
      setStatus(novoStatus);
    }
    setLoading(false);
  }

  if (status === "CONFIRMADO") {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200">
        <p className="font-semibold text-lg">✅ Presença Confirmada!</p>
        <p className="text-xs mt-1">
          Obrigado por servir! A liderança já foi notificada.
        </p>
      </div>
    );
  }

  if (status === "RECUSADO") {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg border border-red-200">
        <p className="font-semibold text-lg">❌ Escala Recusada</p>
        <p className="text-xs mt-1">
          Registramos que você não poderá ir. Obrigado pelo aviso!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Por favor, confirme se poderá servir neste dia:
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => handleResposta("CONFIRMADO")}
          disabled={loading}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Sim, confirmo minha presença"}
        </button>
        <button
          onClick={() => handleResposta("RECUSADO")}
          disabled={loading}
          className="w-full py-3 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition disabled:opacity-50"
        >
          Não poderei ir
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  ArrowLeft,
} from "lucide-react";

function StatusContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const error = searchParams.get("error");

  const handleCloseOrRedirect = () => {
    if (typeof window !== "undefined") {
      window.close();
      // Fallback caso o navegador bloqueie o window.close()
      setTimeout(() => {
        window.location.href = process.env.NEXT_PUBLIC_APP_URL || "/";
      }, 300);
    }
  };

  const getStatusConfig = () => {
    if (action === "CONFIRM") {
      return {
        icon: (
          <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
        ),
        title: "Presença Confirmada!",
        description:
          "Sua presença foi registrada com sucesso. Obrigado por disponibilizar seu tempo e servir!",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    }

    if (action === "DECLINE") {
      return {
        icon: <XCircle className="w-16 h-16 text-amber-500" />,
        title: "Ausência Registrada",
        description:
          "Sua resposta foi salva. O líder do seu ministério foi notificado para organizar a substituição.",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    }

    if (
      error === "invalid_token" ||
      error === "missing_token" ||
      error === "not_found"
    ) {
      return {
        icon: <AlertTriangle className="w-16 h-16 text-rose-500" />,
        title: "Link Inválido ou Expirado",
        description:
          "Este link de confirmação não é mais válido ou a escala foi alterada. Solicite um novo envio ao seu líder.",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      };
    }

    return {
      icon: <AlertTriangle className="w-16 h-16 text-rose-500" />,
      title: "Ops! Algo deu errado",
      description:
        "Ocorreu um erro ao processar sua resposta. Por favor, tente novamente mais tarde.",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl space-y-6">
        {/* Ícone Indicador */}
        <div className="flex justify-center pt-2">{config.icon}</div>

        {/* Mensagem Principal */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {config.title}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            {config.description}
          </p>
        </div>

        {/* Card Informativo Exemplo */}
        {action && (
          <div
            className={`p-4 rounded-xl border ${config.badgeColor} flex items-center justify-center gap-3 text-sm font-medium`}
          >
            <Calendar className="w-5 h-5 flex-shrink-0" />
            <span>Escala atualizada no sistema</span>
          </div>
        )}

        {/* Ações / Botões */}
        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={handleCloseOrRedirect}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Fechar esta janela
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Carregando status...
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  );
}

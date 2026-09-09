// components/voluntario-agenda-cliente.tsx
"use client";

import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Church,
  ArrowRight,
} from "lucide-react";

interface EscalaItem {
  id: string;
  status: string;
  observacao: string;
  funcao: string;
  eventoTitulo: string;
  dataHora: Date | string;
}

interface Props {
  nomeVoluntario: string;
  departamento: string;
  nomeIgreja: string;
  escalas: EscalaItem[];
}

export function VoluntarioAgendaCliente({
  nomeVoluntario,
  departamento,
  nomeIgreja,
  escalas,
}: Props) {
  const agora = new Date();

  // Separa escalas futuras e passadas
  const proximasEscalas = escalas.filter((e) => new Date(e.dataHora) >= agora);
  const escalasPassadas = escalas.filter((e) => new Date(e.dataHora) < agora);

  const formatarData = (dataHora: Date | string) => {
    const d = new Date(dataHora);
    return d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMADO":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
          </span>
        );
      case "RECUSADO":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5" /> Recusado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" /> Pendente
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* CABEÇALHO COM INFO DO VOLUNTÁRIO */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          {nomeIgreja && (
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <Church className="w-4 h-4" />
              <span>{nomeIgreja}</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Olá, {nomeVoluntario}! 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sua agenda de escalas no ministério ({departamento})
            </p>
          </div>
        </div>

        {/* PRÓXIMAS ESCALAS */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Próximas Escalas ({proximasEscalas.length})
          </h2>

          {proximasEscalas.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
              Você não tem nenhuma escala futura agendada no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {proximasEscalas.map((escala) => (
                <div
                  key={escala.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">
                        {escala.eventoTitulo}
                      </h3>
                      {getStatusBadge(escala.status)}
                    </div>
                    <p className="text-xs font-medium text-slate-500 capitalize">
                      {formatarData(escala.dataHora)}
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">
                      Função: {escala.funcao}
                    </p>
                  </div>

                  {/* Botão de Ação Rápida */}
                  <Link
                    href={`/confirmar/${escala.id}`}
                    className="inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                  >
                    <span>Responder / Ver</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HISTÓRICO / ESCALAS PASSADAS */}
        {escalasPassadas.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Histórico ({escalasPassadas.length})
            </h2>

            <div className="space-y-2">
              {escalasPassadas.map((escala) => (
                <div
                  key={escala.id}
                  className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between opacity-80"
                >
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {escala.eventoTitulo}
                    </h4>
                    <p className="text-xs text-slate-400 capitalize">
                      {formatarData(escala.dataHora)} • {escala.funcao}
                    </p>
                  </div>
                  {getStatusBadge(escala.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

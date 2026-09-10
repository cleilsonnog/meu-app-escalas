// components/relatorios-voluntarios.tsx
"use client";

import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
  CalendarCheck,
} from "lucide-react";

interface Props {
  resumo: {
    totalEscalas: number;
    confirmadas: number;
    recusadas: number;
    pendentes: number;
    taxaConfirmacao: number;
    taxaRecusa: number;
    totalVoluntariosCadastrados: number;
    voluntarioEscaladosUnicos: number;
  };
  sobrecarregados: Array<{
    nome: string;
    departamento: string;
    quantidade: number;
  }>;
}

export function RelatoriosVoluntarios({ resumo, sobrecarregados }: Props) {
  return (
    <div className="space-y-6">
      {/* TÍTULO DA ABA */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Relatórios & Desempenho
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Visão geral do engajamento e assiduidade dos voluntários neste mês.
        </p>
      </div>

      {/* CARDS DE KPIS / MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Taxa de Confirmação */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Taxa de Presença
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {resumo.taxaConfirmacao}%
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              ({resumo.confirmadas} confirmadas)
            </span>
          </div>
        </div>

        {/* CARD 2: Pendentes */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Aguardando Resposta
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {resumo.pendentes}
            </span>
            <span className="text-xs text-amber-600 font-medium">
              escalas pendentes
            </span>
          </div>
        </div>

        {/* CARD 3: Recusadas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Recusadas
            </span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {resumo.taxaRecusa}%
            </span>
            <span className="text-xs text-red-600 font-medium">
              ({resumo.recusadas} recusadas)
            </span>
          </div>
        </div>

        {/* CARD 4: Engajamento da Equipe */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Voluntários Ativos
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {resumo.voluntarioEscaladosUnicos}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              de {resumo.totalVoluntariosCadastrados} cadastrados
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO INFERIOR: ALERTA DE SOBRECARGA E RESUMO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOC 1: ALERTA DE SOBRECARGA */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <h2>Alerta de Sobrecarga (4+ escalas/mês)</h2>
          </div>

          <p className="text-xs text-slate-500">
            Voluntários com muitas escalas no mês podem entrar em cansaço.
            Considere rodiziar a equipe.
          </p>

          {sobrecarregados.length === 0 ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
              ✅ A distribuição está equilibrada neste mês! Nenhum voluntário
              ultrapassou 4 escalas.
            </div>
          ) : (
            <div className="space-y-2">
              {sobrecarregados.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 block">
                      {item.nome}
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.departamento}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {item.quantidade} escalas no mês
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOC 2: RESUMO GERAL DE ESCALAS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
            <CalendarCheck className="w-5 h-5" />
            <h2>Resumo Operacional do Mês</h2>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">
                Total de Escalas Criadas
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {resumo.totalEscalas}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">
                Escalas Confirmadas
              </span>
              <span className="font-bold text-emerald-600">
                {resumo.confirmadas}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">
                Escalas Pendentes
              </span>
              <span className="font-bold text-amber-600">
                {resumo.pendentes}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm py-2">
              <span className="text-slate-600 dark:text-slate-400">
                Escalas Recusadas
              </span>
              <span className="font-bold text-red-600">{resumo.recusadas}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

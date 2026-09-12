"use client";

import { useState } from "react";
import { UserPlus, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  adicionarVoluntarioAoEvento,
  excluirEscala,
  excluirEvento,
  gerarLinksNotificacao,
} from "@/app/actions/escalas";

interface ScheduleItem {
  id: string;
  status: "PENDENTE" | "CONFIRMADO" | "RECUSADO";
  funcaoEspecífica?: string;
  funcaoEspecifica?: string;
  volunteerId?: string;
  observacao?: string;
  volunteer?: {
    id?: string;
    nome?: string;
    telefone?: string;
  };
}

interface VoluntarioOption {
  id: string;
  nome: string;
  departamento?: string | null;
}

interface EscalaCardProps {
  eventId: string;
  eventoTitulo: string;
  dataHora: string;
  schedules: ScheduleItem[];
  voluntarios?: VoluntarioOption[];
  nomeIgreja?: string;
}

export function EscalaCard({
  eventId,
  eventoTitulo,
  dataHora,
  schedules = [],
  voluntarios = [],
  nomeIgreja,
}: EscalaCardProps) {
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingEvento, setDeletingEvento] = useState(false);

  // Formata a data e hora do culto (Fuso de Brasília)
  const dataFormatada = new Date(dataHora).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Notificar no WhatsApp
  async function enviarNotificacaoWhatsApp(
    scheduleId: string,
    volunteerId: string,
    nome: string,
    telefone: string,
    funcao: string,
  ) {
    const links = await gerarLinksNotificacao(scheduleId);
    if ("error" in links) {
      alert(links.error);
      return;
    }

    const linkConfirmacao = `${window.location.origin}${links.confirmPath}`;
    const linkAgendaPessoal = volunteerId
      ? `${window.location.origin}${links.portalPath}`
      : "";

    let telefoneLimpo = (telefone || "").replace(/\D/g, "");

    // Adiciona o DDI 55 do Brasil se o número tiver apenas DDD + Número (10 ou 11 dígitos)
    if (telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11) {
      telefoneLimpo = `55${telefoneLimpo}`;
    }
    const linhaIgreja = nomeIgreja ? `⛪ *${nomeIgreja}*\n` : "";
    // 👈 3. Linha adicional com a agenda do voluntário (se existir)
    const linhaAgenda = linkAgendaPessoal
      ? `\n👀 *Ver todas as suas escalas:* ${linkAgendaPessoal}\n`
      : "";

    const mensagem =
      `*${linhaIgreja}*\n` +
      `Olá, *${nome}*! 👋\n\n` +
      `Você foi escalado(a) para o culto:\n` +
      `📌 *${eventoTitulo}*\n` +
      `📅 *Data/Hora:* ${dataFormatada}\n` +
      `🛠️ *Função:* ${funcao}\n\n` +
      `Por favor, confirme sua presença ou avise se não poderá ir pelo link abaixo:\n` +
      `👉 ${linkConfirmacao}\n` +
      `${linhaAgenda}\n` +
      `Contamos com você! Deus abençoe.`;

    const urlWhatsApp = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(
      mensagem,
    )}`;
    window.open(urlWhatsApp, "_blank");
  }

  // Adicionar Voluntário
  async function handleAdicionarVoluntario(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.append("eventId", eventId);

    const result = await adicionarVoluntarioAoEvento(formData);

    setLoading(false);
    if (result.success) {
      setOpenModal(false);
    } else {
      alert(result.error || "Erro ao adicionar voluntário.");
    }
  }

  // Excluir um único voluntário da escala
  async function handleExcluirEscala(scheduleId: string, nome: string) {
    if (confirm(`Tem certeza que deseja remover ${nome} desta escala?`)) {
      setDeletingId(scheduleId);
      const res = await excluirEscala(scheduleId);
      setDeletingId(null);

      if (res.error) {
        alert(res.error);
      }
    }
  }

  // Excluir o evento/culto por completo
  async function handleExcluirEvento() {
    if (
      confirm(
        `Tem certeza que deseja excluir o culto "${eventoTitulo}" e todas as suas escalas?`,
      )
    ) {
      setDeletingEvento(true);
      const res = await excluirEvento(eventId);
      setDeletingEvento(false);

      if (res.error) {
        alert(res.error);
      }
    }
  }

  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      {/* CABEÇALHO DO CARD */}
      <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="break-words text-lg font-bold text-slate-900 dark:text-slate-100">
            {eventoTitulo}
          </h3>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* BOTÃO PARA ADD VOLUNTÁRIO */}
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60">
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Voluntário</span>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Escalar Voluntário
                  </DialogTitle>
                  <p className="text-xs text-slate-500">
                    Evento:{" "}
                    <strong className="text-indigo-600">{eventoTitulo}</strong>
                  </p>
                </DialogHeader>

                <form
                  onSubmit={handleAdicionarVoluntario}
                  className="space-y-4 mt-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Selecione o Voluntário
                    </label>
                    <select
                      name="volunteerId"
                      required
                      className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Escolha um voluntário...</option>
                      {voluntarios.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nome} {v.departamento ? `(${v.departamento})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Função no Culto
                    </label>
                    <input
                      type="text"
                      name="funcaoEspecifica"
                      required
                      placeholder="Ex: Violão, Recepção, Som..."
                      className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 inline-flex items-center justify-center gap-2 font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      "Confirmar e Escalar"
                    )}
                  </button>
                </form>
              </DialogContent>
            </Dialog>

            {/* BOTÃO PARA APAGAR O CULTO INTEIRO */}
            <button
              onClick={handleExcluirEvento}
              disabled={deletingEvento}
              title="Excluir este Culto/Evento"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50"
            >
              {deletingEvento ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
          📅 {dataFormatada}
        </p>
      </div>

      {/* LISTA DE VOLUNTÁRIOS ESCALADOS NESTE CULTO */}
      <div className="mt-3 space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Voluntários Escala ({schedules.length})
        </span>

        {schedules.map((item) => {
          const nome = item.volunteer?.nome || "Voluntário sem nome";
          const telefone = item.volunteer?.telefone || "";
          const funcao =
            item.funcaoEspecífica || item.funcaoEspecifica || "Geral";

          const badgeColor =
            item.status === "CONFIRMADO"
              ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 border-green-300"
              : item.status === "RECUSADO"
                ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300";

          return (
            <div
              key={item.id}
              className="flex flex-col gap-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                      {nome}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Função:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {funcao}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      const vId =
                        item.volunteer?.id || (item as any).volunteerId || "";
                      enviarNotificacaoWhatsApp(
                        item.id,
                        vId,
                        nome,
                        telefone,
                        funcao,
                      );
                    }}
                    title="Avisar no WhatsApp"
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                  >
                    📲 Whats
                  </button>
                  <button
                    onClick={() => handleExcluirEscala(item.id, nome)}
                    disabled={deletingId === item.id}
                    title="Remover voluntário"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* MOTIVO DA RECUSA (SÓ EXIBE SE HOUVER OBSERVAÇÃO) */}
              {item.status === "RECUSADO" && item.observacao && (
                <div className="mt-1 rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-100 dark:border-red-900/40">
                  <span className="font-bold">Motivo da ausência:</span>{" "}
                  {item.observacao}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

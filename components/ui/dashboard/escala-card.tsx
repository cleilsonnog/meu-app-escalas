"use client";

import { useState } from "react";
import { UserPlus, Loader2, Trash2, Send, Check } from "lucide-react";
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
  notificarVoluntarioEscala,
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
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  // Estados de seleção e controle de mensagens enviadas
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);
  const [sendingBulk, setSendingBulk] = useState(false);

  // Formata a data e hora do culto (Fuso de Brasília)
  const dataFormatada = new Date(dataHora).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Alterna seleção individual
  function toggleSelectVolunteer(scheduleId: string) {
    setSelectedIds((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId],
    );
  }

  // Seleciona ou desmarca todos do card
  function toggleSelectAll() {
    if (selectedIds.length === schedules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(schedules.map((s) => s.id));
    }
  }

  // Marca a escala como notificada na sessão
  function marcarComoNotificado(scheduleId: string) {
    setNotifiedIds((prev) => Array.from(new Set([...prev, scheduleId])));
  }

  // Notificar no WhatsApp (Individual via Evolution API Server Action)
  async function enviarNotificacaoWhatsApp(scheduleId: string) {
    setNotifyingId(scheduleId);
    const originUrl = window.location.origin;

    const res = await notificarVoluntarioEscala(
      scheduleId,
      originUrl,
      nomeIgreja,
    );

    setNotifyingId(null);

    if ("error" in res && res.error) {
      alert(res.error);
      return;
    }

    marcarComoNotificado(scheduleId);
  }

  // Notificar em Lote via Evolution API para os Selecionados
  async function handleEnviarSelecionadosWhatsApp() {
    const selecionados = schedules.filter((s) => selectedIds.includes(s.id));

    if (selecionados.length === 0) {
      alert("Selecione pelo menos um voluntário para notificar.");
      return;
    }

    setSendingBulk(true);
    const originUrl = window.location.origin;

    let erros = 0;

    for (let i = 0; i < selecionados.length; i++) {
      const item = selecionados[i];

      const res = await notificarVoluntarioEscala(
        item.id,
        originUrl,
        nomeIgreja,
      );

      if ("success" in res && res.success) {
        marcarComoNotificado(item.id);
      } else {
        erros++;
      }

      if (i < selecionados.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setSendingBulk(false);

    if (erros > 0) {
      alert(
        `Envio concluído com ${erros} erro(s). Verifique os logs se necessário.`,
      );
    }
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
      } else {
        setSelectedIds((prev) => prev.filter((id) => id !== scheduleId));
        setNotifiedIds((prev) => prev.filter((id) => id !== scheduleId));
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

  const todosSelecionados =
    schedules.length > 0 && selectedIds.length === schedules.length;

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

      {/* ÁREA DE SELEÇÃO E CONTADOR */}
      <div className="mt-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={todosSelecionados}
            onChange={toggleSelectAll}
            disabled={schedules.length === 0}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
          />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Voluntários ({schedules.length})
          </span>
        </label>

        {/* CONTADOR DE SELEÇÃO E BOTÃO DE DISPARO EM LOTE */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
              {selectedIds.length} selecionado(s)
            </span>
          )}

          <button
            onClick={handleEnviarSelecionadosWhatsApp}
            disabled={selectedIds.length === 0 || sendingBulk}
            title="Enviar WhatsApp para todos os selecionados"
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sendingBulk ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            <span>Avisar Selecionados</span>
          </button>
        </div>
      </div>

      {/* LISTA DE VOLUNTÁRIOS ESCALADOS NESTE CULTO */}
      <div className="mt-2 space-y-2 font-sans">
        {schedules.map((item) => {
          const nome = item.volunteer?.nome || "Voluntário sem nome";
          const funcao =
            item.funcaoEspecífica || item.funcaoEspecifica || "Geral";
          const isSelected = selectedIds.includes(item.id);
          const isNotified = notifiedIds.includes(item.id);
          const isNotifyingThis = notifyingId === item.id;

          const badgeColor =
            item.status === "CONFIRMADO"
              ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 border-green-300"
              : item.status === "RECUSADO"
                ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300";

          return (
            <div
              key={item.id}
              className={`flex flex-col gap-1 p-2.5 rounded-lg border transition ${
                isSelected
                  ? "bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectVolunteer(item.id)}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                        {nome}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}
                      >
                        {item.status}
                      </span>

                      {/* INDICADOR VISUAL DE MENSAGEM ENVIADA */}
                      {isNotified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                          <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          Notificado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Função:{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {funcao}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => enviarNotificacaoWhatsApp(item.id)}
                    disabled={isNotifyingThis || sendingBulk}
                    title={
                      isNotified
                        ? "Reenviar mensagem no WhatsApp"
                        : "Avisar no WhatsApp (Individual)"
                    }
                    className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition disabled:opacity-50 ${
                      isNotified
                        ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    }`}
                  >
                    {isNotifyingThis ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isNotified ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Enviado</span>
                      </>
                    ) : (
                      <span>📲 Whats</span>
                    )}
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

              {/* MOTIVO DA RECUSA */}
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

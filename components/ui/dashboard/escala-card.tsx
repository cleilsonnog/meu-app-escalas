"use client";

interface EscalaCardProps {
  id: string;
  nome: string;
  telefone: string;
  eventoTitulo: string;
  funcao: string;
  dataHora: string;
  status: "Pendente" | "Confirmado" | "Recusado";
}

export function EscalaCard({
  id,
  nome,
  telefone,
  eventoTitulo,
  funcao,
  dataHora,
  status,
}: EscalaCardProps) {
  // Formata a data para um padrão amigável (Ex: Domingo, 15 de Outubro às 19:00)
  const dataFormatada = new Date(dataHora).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Trata o número do WhatsApp removendo caracteres especiais (ex: +55 (22) 99999-9999 -> 5522999999999)
  const telefoneLimpo = telefone.replace(/\D/g, "");

  function enviarNotificacaoWhatsApp() {
    const linkConfirmacao = `${window.location.origin}/confirmar/${id}`;

    const mensagem =
      `Olá, *${nome}*! 👋\n\n` +
      `Você foi escalado(a) para o culto:\n` +
      `📌 *${eventoTitulo}*\n` +
      `📅 *Data/Hora:* ${dataFormatada}\n` +
      `🎸 *Função:* ${funcao}\n\n` +
      `Por favor, confirme sua presença ou avise se não poderá ir pelo link abaixo:\n` +
      `👉 ${linkConfirmacao}\n\n` +
      `Contamos com você! Deus abençoe.`;

    const urlWhatsApp = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsApp, "_blank");
  }

  const badgeColor =
    status === "Confirmado"
      ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 border-green-300"
      : status === "Recusado"
        ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-300"
        : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300";

  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeColor}`}
          >
            {status}
          </span>
          <span className="text-right text-xs text-muted-foreground capitalize">
            {dataFormatada}
          </span>
        </div>

        <h3 className="mb-1 break-words text-lg font-bold text-slate-900 dark:text-slate-100">
          {nome}
        </h3>
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">
          {eventoTitulo}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Função:{" "}
          <strong className="text-slate-700 dark:text-slate-300">
            {funcao}
          </strong>
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="text-xs text-slate-400">{telefone}</span>

        <button
          onClick={enviarNotificacaoWhatsApp}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
        >
          📲 Avisar no Whats
        </button>
      </div>
    </div>
  );
}

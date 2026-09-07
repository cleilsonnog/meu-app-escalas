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
    <div className="flex flex-col justify-between p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeColor}`}
          >
            {status}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {dataFormatada}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
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

      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400">{telefone}</span>

        <button
          onClick={enviarNotificacaoWhatsApp}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition"
        >
          📲 Avisar no Whats
        </button>
      </div>
    </div>
  );
}

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BotoesConfirmacao } from "./botoes-confirmacao";

export default async function ConfirmarEscalaPage({
  params,
}: {
  params: { id: string };
}) {
  const escala = await prisma.schedule.findUnique({
    where: { id: params.id },
    include: {
      volunteer: true,
      event: true,
    },
  });

  if (!escala) {
    notFound();
  }

  const dataFormatada = new Date(escala.event.dataHora).toLocaleDateString(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-lg border p-6 text-center space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Confirmação de Escala
          </span>
          <h1 className="text-2xl font-bold mt-1">{escala.event.titulo}</h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">
            {dataFormatada}
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border text-left space-y-2">
          <p className="text-sm">
            <strong className="font-medium">Voluntário:</strong>{" "}
            {escala.volunteer.nome}
          </p>
          <p className="text-sm">
            <strong className="font-medium">Função:</strong>{" "}
            {escala.funcaoEspecífica}
          </p>
          <p className="text-sm">
            <strong className="font-medium">Departamento:</strong>{" "}
            {escala.volunteer.departamento}
          </p>
        </div>

        {/* Componente interativo para botões de resposta */}
        <BotoesConfirmacao escalaId={escala.id} statusAtual={escala.status} />
      </div>
    </div>
  );
}

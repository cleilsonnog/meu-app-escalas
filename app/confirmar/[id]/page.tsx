import prisma from "@/lib/prisma";
import { ConfirmarCliente } from "@/components/confirmar-cliente";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function ConfirmarEscalaPage({
  params,
}: {
  params: { id: string };
}) {
  const scheduleId = params?.id;

  if (!scheduleId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
          <p className="text-slate-600 font-medium">Link inválido.</p>
        </div>
      </div>
    );
  }

  // Busca a escala com as relações de Evento e Voluntário
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      status: true,
      observacao: true,
      funcaoEspecífica: true,
      event: {
        select: {
          titulo: true,
          dataHora: true,
          clerkUserId: true, // 👈 1. Incluído para buscar o nome da igreja
        },
      },
      volunteer: {
        select: {
          nome: true,
          departamento: true,
        },
      },
    },
  });

  if (!schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
          <p className="text-slate-600 font-medium">
            Escala não encontrada ou expirada.
          </p>
        </div>
      </div>
    );
  }

  // 👈 2. Busca o nome da igreja/ministério
  let nomeIgreja = "";
  if (schedule.event?.clerkUserId) {
    const userSettings = await prisma.userSettings.findUnique({
      where: { clerkUserId: schedule.event.clerkUserId },
      select: { churchName: true },
    });
    nomeIgreja = userSettings?.churchName || "";
  }

  // Acesso flexível para evitar erros de acentuação no TypeScript durante o build
  const item = schedule as Record<string, any>;
  const funcao = item.funcaoEspecífica || item.funcaoEspecifica || "Geral";

  return (
    <ConfirmarCliente
      scheduleId={schedule.id}
      statusInicial={schedule.status}
      observacaoInicial={schedule.observacao || ""}
      eventoTitulo={schedule.event?.titulo || "Culto"}
      dataHora={schedule.event?.dataHora}
      nomeVoluntario={schedule.volunteer?.nome || "Voluntário"}
      funcao={funcao}
      departamento={schedule.volunteer?.departamento || "Geral"}
      nomeIgreja={nomeIgreja} // 👈 3. Prop enviada para o componente de UI
    />
  );
}

import prisma from "@/lib/prisma";
import { ConfirmarCliente } from "@/components/confirmar-cliente";

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
    include: {
      event: true,
      volunteer: true,
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

  return (
    <ConfirmarCliente
      scheduleId={schedule.id}
      statusInicial={schedule.status}
      observacaoInicial={schedule.observacao || ""}
      eventoTitulo={schedule.event?.titulo || "Culto"}
      dataHora={schedule.event?.dataHora}
      nomeVoluntario={schedule.volunteer?.nome || "Voluntário"}
      funcao={schedule.funcaoEspecifica || schedule.funcaoEspecífica || "Geral"}
      departamento={schedule.volunteer?.departamento || "Geral"}
    />
  );
}

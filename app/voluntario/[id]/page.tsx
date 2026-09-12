// app/voluntario/[id]/page.tsx
import prisma from "@/lib/prisma";
import { VoluntarioAgendaCliente } from "@/components/voluntario-agenda-cliente";
import { Metadata } from "next";
import { generateScheduleToken, verifyScheduleToken } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Minhas Escalas | Portal do Voluntário",
  robots: { index: false, follow: false, nocache: true },
};

export default async function VoluntarioAgendaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { token?: string };
}) {
  const volunteerId = params?.id;
  const tokenPayload = searchParams?.token
    ? verifyScheduleToken(searchParams.token)
    : null;

  if (
    !volunteerId ||
    !tokenPayload ||
    tokenPayload.action !== "PORTAL" ||
    tokenPayload.volunteerId !== volunteerId
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <p className="text-slate-600 font-medium">
          Link de voluntário inválido.
        </p>
      </div>
    );
  }

  // 1. Busca os dados do voluntário e suas escalas usando a relação 'escalas'
  const voluntario = await prisma.volunteer.findUnique({
    where: { id: volunteerId },
    include: {
      escalas: {
        include: {
          event: true,
        },
        orderBy: {
          event: {
            dataHora: "asc",
          },
        },
      },
    },
  });

  if (!voluntario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <p className="text-slate-600 font-medium">Voluntário não encontrado.</p>
      </div>
    );
  }

  // Converte a lista de escalas para garantir a tipagem no TypeScript
  const listaEscalas = (voluntario.escalas || []) as any[];

  // 2. Busca o nome da igreja/ministério
  let nomeIgreja = "";
  const primeiroEvento = listaEscalas[0]?.event;
  if (primeiroEvento?.clerkUserId) {
    const userSettings = await prisma.userSettings.findUnique({
      where: { clerkUserId: primeiroEvento.clerkUserId },
      select: { churchName: true },
    });
    nomeIgreja = userSettings?.churchName || "";
  }

  // 3. Formata os dados para o componente cliente
  const escalasFormatadas = listaEscalas.map((item: any) => ({
    id: item.id,
    status: item.status,
    observacao: item.observacao || "",
    funcao: item.funcaoEspecífica || item.funcaoEspecifica || "Geral",
    eventoTitulo: item.event?.titulo || "Culto",
    dataHora: item.event?.dataHora || new Date(),
    token: generateScheduleToken({
      scheduleId: item.id,
      volunteerId,
      action: "CONFIRM",
    }),
  }));

  return (
    <VoluntarioAgendaCliente
      nomeVoluntario={voluntario.nome}
      departamento={voluntario.departamento || "Geral"}
      nomeIgreja={nomeIgreja}
      escalas={escalasFormatadas}
    />
  );
}

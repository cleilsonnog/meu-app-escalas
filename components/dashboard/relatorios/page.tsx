// app/dashboard/relatorios/page.tsx
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { RelatoriosVoluntarios } from "@/components/relatorios-voluntarios";
import { redirect } from "next/navigation";

export default async function RelatoriosPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Define o período do mês atual
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimMes = new Date(
    agora.getFullYear(),
    agora.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  // 1. Busca todas as escalas do mês atual criadas por este usuário
  const escalasMes = await prisma.schedule.findMany({
    where: {
      event: {
        clerkUserId: userId,
        dataHora: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
    },
    include: {
      volunteer: true,
      event: true,
    },
  });

  // 2. Busca o total de voluntários cadastrados
  const totalVoluntariosCadastrados = await prisma.volunteer.count({
    where: { clerkUserId: userId },
  });

  // 3. Cálculos de KPIs
  const totalEscalas = escalasMes.length;
  const confirmadas = escalasMes.filter(
    (s) => s.status === "CONFIRMADO",
  ).length;
  const recusadas = escalasMes.filter((s) => s.status === "RECUSADO").length;
  const pendentes = escalasMes.filter(
    (s) => s.status === "PENDENTE" || !s.status,
  ).length;

  const taxaConfirmacao =
    totalEscalas > 0 ? Math.round((confirmadas / totalEscalas) * 100) : 0;
  const taxaRecusa =
    totalEscalas > 0 ? Math.round((recusadas / totalEscalas) * 100) : 0;

  // 4. Mapeamento de sobrecarga de voluntários no mês (quem foi escalado + de 4 vezes)
  const contagemPorVoluntario: Record<
    string,
    { nome: string; departamento: string; quantidade: number }
  > = {};

  escalasMes.forEach((s) => {
    if (s.volunteer) {
      const vId = s.volunteer.id;
      if (!contagemPorVoluntario[vId]) {
        contagemPorVoluntario[vId] = {
          nome: s.volunteer.nome,
          departamento: s.volunteer.departamento || "Geral",
          quantidade: 0,
        };
      }
      contagemPorVoluntario[vId].quantidade += 1;
    }
  });

  const voluntarioEscaladosUnicos = Object.keys(contagemPorVoluntario).length;

  // Lista de voluntários com sobrecarga (escalados 4 ou mais vezes no mês)
  const sobrecarregados = Object.values(contagemPorVoluntario)
    .filter((v) => v.quantidade >= 4)
    .sort((a, b) => b.quantidade - a.quantidade);

  return (
    <RelatoriosVoluntarios
      resumo={{
        totalEscalas,
        confirmadas,
        recusadas,
        pendentes,
        taxaConfirmacao,
        taxaRecusa,
        totalVoluntariosCadastrados,
        voluntarioEscaladosUnicos,
      }}
      sobrecarregados={sobrecarregados}
    />
  );
}

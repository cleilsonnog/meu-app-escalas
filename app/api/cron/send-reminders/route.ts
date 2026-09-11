import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { StatusEscala } from "@prisma/client";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // 1. Validação do token de segurança do Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 401 },
    );
  }

  // 2. Intervalo do dia seguinte (Fuso Horário de Brasília)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  // 3. Busca escalas PENDENTES e CONFIRMADAS para amanhã
  const activeSchedules = await prisma.schedule.findMany({
    where: {
      status: {
        in: [StatusEscala.PENDENTE, StatusEscala.CONFIRMADO],
      },
      event: {
        dataHora: {
          gte: tomorrow,
          lte: endOfTomorrow,
        },
      },
    },
    include: {
      volunteer: true,
      event: true,
    },
  });

  // Sanitiza a URL base
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "")
    .trim()
    .replace(/\/$/, "");

  // 4. Busca os nomes das Igrejas/Ministérios para os eventos encontrados
  const clerkUserIds = [
    ...new Set(
      activeSchedules
        .map((s) => s.event?.clerkUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const userSettings = await prisma.userSettings.findMany({
    where: { clerkUserId: { in: clerkUserIds } },
    select: { clerkUserId: true, churchName: true },
  });

  const churchNameMap = new Map(
    userSettings.map((s) => [s.clerkUserId, s.churchName]),
  );

  // 5. Filtra voluntários com telefone cadastrado
  const validSchedules = activeSchedules.filter(
    (item) => item.volunteer && item.volunteer.telefone,
  );

  // 6. Disparo em paralelo
  const results = await Promise.allSettled(
    validSchedules.map(async (item) => {
      const funcao = item.funcaoEspecífica || "Serviço Geral";
      const nomeIgreja =
        churchNameMap.get(item.event.clerkUserId || "") || "Sua Igreja";

      // Formatação da data e hora (ex: "sáb., 12/09, 13:00")
      let dataHoraTexto = "Horário não informado";
      if (item.event.dataHora) {
        const dateObj = new Date(item.event.dataHora);
        const dataFormatada = dateObj.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        const horaFormatada = dateObj.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        dataHoraTexto = `${dataFormatada}, ${horaFormatada}`;
      }

      // Links diretos
      const confirmPageUrl = `${appUrl}/confirmar/${item.id}`;
      const volunteerPortalUrl = `${appUrl}/voluntario/${item.volunteer.id}`;

      let message = "";

      // MENSAGEM PARA QUEM JÁ CONFIRMOU (Lembrete)
      if (item.status === StatusEscala.CONFIRMADO) {
        message =
          `⛪ *${nomeIgreja}*\n` +
          `Olá, *${item.volunteer.nome}*! 👋\n\n` +
          `Passando para lembrar do seu servir amanhã!\n` +
          `📌 *${item.event.titulo}*\n` +
          `📅 *Data/Hora:* ${dataHoraTexto}\n` +
          `🛠️ *Função:* ${funcao}\n\n` +
          `Teve algum imprevisto de última hora? Avise pelo link abaixo:\n` +
          `👉 ${confirmPageUrl}\n\n` +
          `👀 *Ver todas as suas escalas:* ${volunteerPortalUrl}\n\n` +
          `Contamos com você! Deus abençoe. 🙏`;
      }
      // MENSAGEM PARA QUEM ESTÁ PENDENTE (Solicitação de resposta)
      else {
        message =
          `⛪ *${nomeIgreja}*\n` +
          `Olá, *${item.volunteer.nome}*! 👋\n\n` +
          `Você foi escalado(a) para o culto:\n` +
          `📌 *${item.event.titulo}*\n` +
          `📅 *Data/Hora:* ${dataHoraTexto}\n` +
          `🛠️ *Função:* ${funcao}\n\n` +
          `Por favor, confirme sua presença ou avise se não poderá ir pelo link abaixo:\n` +
          `👉 ${confirmPageUrl}\n\n` +
          `👀 *Ver todas as suas escalas:* ${volunteerPortalUrl}\n\n` +
          `Contamos com você! Deus abençoe. 🙏`;
      }

      return sendWhatsAppMessage({
        phone: item.volunteer.telefone,
        message,
      });
    }),
  );

  return NextResponse.json({
    totalFound: activeSchedules.length,
    processedCount: validSchedules.length,
    successCount: results.filter((r) => r.status === "fulfilled").length,
    failureCount: results.filter((r) => r.status === "rejected").length,
  });
}

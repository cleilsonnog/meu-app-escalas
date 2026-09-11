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

  // Sanitiza a URL base removendo barra no final
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  // 4. Filtra voluntários com telefone cadastrado
  const validSchedules = activeSchedules.filter(
    (item) => item.volunteer && item.volunteer.telefone,
  );

  // 5. Disparo em paralelo
  const results = await Promise.allSettled(
    validSchedules.map(async (item) => {
      const funcao = item.funcaoEspecífica || "Serviço Geral";
      const horario = item.event.dataHora
        ? new Date(item.event.dataHora).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
          })
        : "Horário não informado";

      // URL que direciona o voluntário para o card do print (/confirmar/[id])
      const confirmPageUrl = `${appUrl}/confirmar/${item.id}`;

      let message = "";

      // MENSAGEM PARA QUEM JÁ CONFIRMOU (Lembrete)
      if (item.status === StatusEscala.CONFIRMADO) {
        message =
          `Olá, *${item.volunteer.nome}*! Passando para lembrar do seu servir amanhã! 🙌\n\n` +
          `📌 *Evento:* ${item.event.titulo}\n` +
          `🛠️ *Função:* ${funcao}\n` +
          `⏰ *Horário:* ${horario}\n\n` +
          `Contamos com a sua presença!\n\n` +
          `🚨 *Teve algum imprevisto de última hora?*\n` +
          `Acesse o link para atualizar seu status ou avisar o líder:\n` +
          `${confirmPageUrl}`;
      }
      // MENSAGEM PARA QUEM AINDA ESTÁ PENDENTE (Solicitação de resposta)
      else {
        message =
          `Olá, *${item.volunteer.nome}*! 👋\n\n` +
          `Você está escalado(a) para servir amanhã:\n` +
          `📌 *Evento:* ${item.event.titulo}\n` +
          `🛠️ *Função:* ${funcao}\n` +
          `⏰ *Horário:* ${horario}\n\n` +
          `Por favor, acesse o link abaixo para confirmar sua presença ou relatar ausência:\n` +
          `👉 ${confirmPageUrl}`;
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

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { generateScheduleToken } from "@/lib/tokens";
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

  // 2. Intervalo de busca para o dia seguinte
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  // 3. Busca escalas pendentes
  const pendingSchedules = await prisma.schedule.findMany({
    where: {
      status: StatusEscala.PENDENTE,
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

  // Sanitiza a URL removendo barra no final, se houver
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  // 4. Filtrar voluntários com telefone válido antes do disparo
  const validSchedules = pendingSchedules.filter(
    (item) => item.volunteer && item.volunteer.telefone,
  );

  // 5. Disparo em paralelo das mensagens
  const results = await Promise.allSettled(
    validSchedules.map(async (item) => {
      const confirmToken = generateScheduleToken({
        scheduleId: item.id,
        volunteerId: item.volunteer.id,
        action: "CONFIRM",
      });

      const declineToken = generateScheduleToken({
        scheduleId: item.id,
        volunteerId: item.volunteer.id,
        action: "DECLINE",
      });

      const confirmUrl = `${appUrl}/api/schedules/respond?token=${confirmToken}`;
      const declineUrl = `${appUrl}/api/schedules/respond?token=${declineToken}`;

      const funcao = item.funcaoEspecífica || "Serviço Geral";

      // Fix do Fuso Horário do Brasil para servidores UTC (Vercel)
      const horario = item.event.dataHora
        ? new Date(item.event.dataHora).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
          })
        : "Horário não informado";

      const message = `Olá, *${item.volunteer.nome}*! 👋\n\nVocê está escalado(a) para servir amanhã:\n📌 *Evento:* ${item.event.titulo}\n🛠️ *Função:* ${funcao}\n⏰ *Horário:* ${horario}\n\nPor favor, confirme sua presença:\n\n✅ *Confirmar:* \n${confirmUrl}\n\n❌ *Não poderei comparecer:* \n${declineUrl}`;

      return sendWhatsAppMessage({
        phone: item.volunteer.telefone,
        message,
      });
    }),
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const failureCount = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    totalFound: pendingSchedules.length,
    processedCount: validSchedules.length,
    successCount,
    failureCount,
  });
}

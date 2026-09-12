import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { generateScheduleToken } from "@/lib/tokens";
import { StatusEscala } from "@prisma/client";

export const maxDuration = 60;

// Helper para criar atrasos assíncronos
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper para fatiar o array em lotes
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function GET(req: NextRequest) {
  // 1. Validação do token de segurança do Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 401 },
    );
  }

  // 2. Intervalo do dia seguinte no fuso de Brasília, independentemente do fuso da Vercel
  const brazilTodayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const brazilToday = Object.fromEntries(
    brazilTodayParts.map(({ type, value }) => [type, value]),
  );
  const nextDay = new Date(
    Date.UTC(
      Number(brazilToday.year),
      Number(brazilToday.month) - 1,
      Number(brazilToday.day) + 1,
    ),
  );
  const tomorrowDate = nextDay.toISOString().slice(0, 10);
  const tomorrow = new Date(`${tomorrowDate}T00:00:00-03:00`);
  const endOfTomorrow = new Date(`${tomorrowDate}T23:59:59.999-03:00`);

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

  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL não configurada." },
      { status: 500 },
    );
  }

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

  // 6. Configuração dos Lotes
  const BATCH_SIZE = 4;
  const DELAY_BETWEEN_BATCHES_MS = 1200; // 1.2 segundos de pausa entre lotes

  const batches = chunkArray(validSchedules, BATCH_SIZE);
  const results: PromiseSettledResult<any>[] = [];

  // Disparo controlado em lotes
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
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
        const confirmToken = generateScheduleToken({
          scheduleId: item.id,
          volunteerId: item.volunteer.id,
          action: "CONFIRM",
        });
        const portalToken = generateScheduleToken(
          {
            scheduleId: item.id,
            volunteerId: item.volunteer.id,
            action: "PORTAL",
          },
          "30d",
        );
        const confirmPageUrl = `${appUrl}/confirmar/${item.id}?token=${encodeURIComponent(confirmToken)}`;
        const volunteerPortalUrl = `${appUrl}/voluntario/${item.volunteer.id}?token=${encodeURIComponent(portalToken)}`;

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

    results.push(...batchResults);

    // Aguarda o intervalo antes de enviar o próximo lote (se não for o último)
    if (i < batches.length - 1) {
      await delay(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const failureCount = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    tomorrowStart: tomorrow.toISOString(),
    tomorrowEnd: endOfTomorrow.toISOString(),
    totalFound: activeSchedules.length,
    processedCount: validSchedules.length,
    successCount,
    failureCount,
    failures: results.flatMap((result) =>
      result.status === "rejected"
        ? [result.reason instanceof Error ? result.reason.message : String(result.reason)]
        : [],
    ),
  });
}

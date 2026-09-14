import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

import { sendWhatsAppMessage } from "@/lib/whatsapp";

import { generateCompactScheduleToken } from "@/lib/tokens";

import { StatusEscala } from "@prisma/client";

export const maxDuration = 60;

const CONCURRENCY_LIMIT = 3;

/**
 * Executa as tarefas mantendo no máximo 3 envios simultâneos.
 *
 * Quando uma mensagem termina, a próxima entra imediatamente.
 */
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  handler: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);

  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex++;

      if (currentIndex >= items.length) {
        return;
      }

      try {
        const value = await handler(items[currentIndex], currentIndex);

        results[currentIndex] = {
          status: "fulfilled",
          value,
        };
      } catch (reason) {
        results[currentIndex] = {
          status: "rejected",
          reason,
        };
      }
    }
  }

  const workers = Array.from(
    {
      length: Math.min(limit, items.length),
    },
    () => worker(),
  );

  await Promise.all(workers);

  return results;
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

  try {
    // 2. Intervalo do dia seguinte no fuso de Brasília

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

    // 3. Busca escalas pendentes e confirmadas

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
        {
          error: "NEXT_PUBLIC_APP_URL não configurada.",
        },
        { status: 500 },
      );
    }

    // 4. Busca nomes das igrejas/ministérios

    const clerkUserIds = [
      ...new Set(
        activeSchedules
          .map((schedule) => schedule.event?.clerkUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const userSettings = await prisma.userSettings.findMany({
      where: {
        clerkUserId: {
          in: clerkUserIds,
        },
      },

      select: {
        clerkUserId: true,
        churchName: true,
      },
    });

    const churchNameMap = new Map(
      userSettings.map((setting) => [setting.clerkUserId, setting.churchName]),
    );

    // 5. Filtra voluntários com telefone válido

    const validSchedules = activeSchedules.filter(
      (item) =>
        item.volunteer &&
        item.volunteer.telefone &&
        item.volunteer.telefone.trim().length > 0,
    );

    // 6. Envio com concorrência controlada

    const results = await runWithConcurrency(
      validSchedules,
      CONCURRENCY_LIMIT,
      async (item, index) => {
        const funcao = item.funcaoEspecífica || "Serviço Geral";

        const nomeIgreja =
          churchNameMap.get(item.event.clerkUserId || "") || "Sua Igreja";

        // Formatação da data e hora

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

        // Token de confirmação

        const confirmToken = generateCompactScheduleToken({
          scheduleId: item.id,
          volunteerId: item.volunteer!.id,
          action: "CONFIRM",
        });

        // Token do portal

        const portalToken = generateCompactScheduleToken(
          {
            scheduleId: item.id,
            volunteerId: item.volunteer!.id,
            action: "PORTAL",
          },
          "30d",
        );

        const confirmPageUrl = `${appUrl}/r/${confirmToken}`;

        const volunteerPortalUrl = `${appUrl}/r/${portalToken}`;

        let message = "";

        // MENSAGEM PARA QUEM JÁ CONFIRMOU

        if (item.status === StatusEscala.CONFIRMADO) {
          message =
            `⛪ *${nomeIgreja}*\n` +
            `Olá, *${item.volunteer!.nome}*! 👋\n\n` +
            `Passando para lembrar do seu servir amanhã!\n` +
            `📌 *${item.event.titulo}*\n` +
            `📅 *Data/Hora:* ${dataHoraTexto}\n` +
            `🛠️ *Função:* ${funcao}\n\n` +
            `Teve algum imprevisto de última hora? Avise pelo link abaixo:\n` +
            `👉 ${confirmPageUrl}\n\n` +
            `👀 *Ver todas as suas escalas:* ${volunteerPortalUrl}\n\n` +
            `Contamos com você! Deus abençoe. 🙏`;
        }

        // MENSAGEM PARA QUEM ESTÁ PENDENTE
        else {
          message =
            `⛪ *${nomeIgreja}*\n` +
            `Olá, *${item.volunteer!.nome}*! 👋\n\n` +
            `Você foi escalado(a) para o culto:\n` +
            `📌 *${item.event.titulo}*\n` +
            `📅 *Data/Hora:* ${dataHoraTexto}\n` +
            `🛠️ *Função:* ${funcao}\n\n` +
            `Por favor, confirme sua presença ou avise se não poderá ir pelo link abaixo:\n` +
            `👉 ${confirmPageUrl}\n\n` +
            `👀 *Ver todas as suas escalas:* ${volunteerPortalUrl}\n\n` +
            `Contamos com você! Deus abençoe. 🙏`;
        }

        console.log(
          `[CRON] Enviando ${index + 1}/${validSchedules.length} para ${item.volunteer!.nome}`,
        );

        // O próprio helper já possui AbortSignal.timeout(15_000)

        const response = await sendWhatsAppMessage({
          phone: item.volunteer!.telefone,
          message,
        });

        console.log(
          `[CRON] Solicitação concluída para ${item.volunteer!.nome}`,
        );

        return response;
      },
    );

    const successCount = results.filter(
      (result) => result.status === "fulfilled",
    ).length;

    const failureCount = results.filter(
      (result) => result.status === "rejected",
    ).length;

    const failures = results.flatMap((result) =>
      result.status === "rejected"
        ? [
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason),
          ]
        : [],
    );

    console.log(
      `[CRON] Finalizado. Sucessos: ${successCount}. Falhas: ${failureCount}.`,
    );

    return NextResponse.json({
      tomorrowStart: tomorrow.toISOString(),
      tomorrowEnd: endOfTomorrow.toISOString(),

      totalFound: activeSchedules.length,
      processedCount: validSchedules.length,

      successCount,
      failureCount,

      concurrencyLimit: CONCURRENCY_LIMIT,

      failures,
    });
  } catch (error) {
    console.error("[CRON] Erro geral:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao processar o Cron.",
      },
      { status: 500 },
    );
  }
}

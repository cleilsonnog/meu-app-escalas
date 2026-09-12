import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyScheduleToken } from "@/lib/tokens";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { StatusEscala } from "@prisma/client";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/schedule/status?error=missing_token", req.url),
    );
  }

  const payload = verifyScheduleToken(token);

  if (
    !payload ||
    !payload.scheduleId ||
    !payload.volunteerId ||
    !["CONFIRM", "DECLINE"].includes(payload.action)
  ) {
    return NextResponse.redirect(
      new URL("/schedule/status?error=invalid_token", req.url),
    );
  }

  const newStatus =
    payload.action === "CONFIRM"
      ? StatusEscala.CONFIRMADO
      : StatusEscala.RECUSADO;

  try {
    // 1. Busca a escala com as relações existentes no Schema (volunteer e event)
    const schedule = await prisma.schedule.findUnique({
      where: { id: payload.scheduleId },
      include: {
        volunteer: true,
        event: true,
      },
    });

    if (!schedule || schedule.volunteerId !== payload.volunteerId) {
      return NextResponse.redirect(
        new URL("/schedule/status?error=not_found", req.url),
      );
    }

    // 2. Atualiza o status da escala no banco de dados
    await prisma.schedule.update({
      where: { id: payload.scheduleId },
      data: { status: newStatus },
    });

    // 3. Notifica o administrador/líder se for RECUSADO
    const adminPhone = process.env.ADMIN_WHATSAPP_PHONE; // Telefone do responsável principal
    if (newStatus === StatusEscala.RECUSADO && adminPhone) {
      const volunteerName = schedule.volunteer?.nome || "Voluntário";
      const eventTitle = schedule.event?.titulo || "Culto/Evento";
      const funcao = schedule.funcaoEspecífica || "Serviço Geral";

      const dataFormatada = schedule.event?.dataHora
        ? new Date(schedule.event.dataHora).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            timeZone: "America/Sao_Paulo",
          })
        : "data não informada";

      const alertMessage =
        `⚠️ *ALERTA DE AUSÊNCIA NA ESCALA*\n\n` +
        `O voluntário *${volunteerName}* informou que *NÃO PODERÁ* comparecer.\n\n` +
        `📌 *Evento:* ${eventTitle}\n` +
        `📅 *Data:* ${dataFormatada}\n` +
        `🛠️ *Função:* ${funcao}\n\n` +
        `Acesse o painel para organizar a substituição.`;

      try {
        await sendWhatsAppMessage({
          phone: adminPhone,
          message: alertMessage,
        });
      } catch (wsError) {
        console.error("Erro ao enviar alerta via WhatsApp:", wsError);
      }
    }

    // 4. Redireciona para a tela de status do voluntário
    return NextResponse.redirect(
      new URL(`/schedule/status?action=${payload.action}`, req.url),
    );
  } catch (error) {
    console.error("Erro ao processar resposta da escala:", error);
    return NextResponse.redirect(
      new URL("/schedule/status?error=server_error", req.url),
    );
  }
}

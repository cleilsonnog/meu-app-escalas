"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import {
  generateCompactScheduleToken,
  verifyScheduleToken,
} from "@/lib/tokens";
import { getAccessContext } from "@/lib/access";
import {
  criarEventoSchema,
  criarEscalaSchema,
  adicionarVoluntarioSchema,
  responderEscalaSchema,
  parseFormData,
} from "@/lib/validations";

export async function gerarLinksNotificacao(scheduleId: string) {
  const access = await getAccessContext();
  if (!access) return { error: "Acesso negado." };

  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,
      event: { clerkUserId: access.ownerClerkUserId },
      ...(access.role === "LEADER" ? { ministryId: access.ministryId } : {}),
    },
    select: { id: true, volunteerId: true },
  });

  if (!schedule) return { error: "Escala não encontrada." };

  const confirmToken = generateCompactScheduleToken({
    scheduleId: schedule.id,
    volunteerId: schedule.volunteerId,
    action: "CONFIRM",
  });
  const portalToken = generateCompactScheduleToken(
    {
      scheduleId: schedule.id,
      volunteerId: schedule.volunteerId,
      action: "PORTAL",
    },
    "30d",
  );

  return {
    confirmPath: `/r/${confirmToken}`,
    portalPath: `/r/${portalToken}`,
  };
}

// 1. Buscar escalas com janela de datas (padrão: 3 meses atrás até o futuro)
export async function getEscalas(options?: { fromMonthsAgo?: number }) {
  const access = await getAccessContext();

  if (!access) {
    return { data: [] };
  }

  const monthsAgo = options?.fromMonthsAgo ?? 3;
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - monthsAgo);
  fromDate.setHours(0, 0, 0, 0);

  try {
    const eventos = await prisma.event.findMany({
      where: {
        clerkUserId: access.ownerClerkUserId,
        dataHora: { gte: fromDate },
        ...(access.role === "LEADER"
          ? { escalas: { some: { ministryId: access.ministryId } } }
          : {}),
      },
      include: {
        escalas: {
          where:
            access.role === "LEADER"
              ? { ministryId: access.ministryId }
              : undefined,
          include: { volunteer: true, ministry: true },
        },
      },
      orderBy: {
        dataHora: "asc",
      },
      take: 200,
    });

    const escalasComEvento = eventos.flatMap((evento) =>
      evento.escalas.map((escala) => ({
        ...escala,
        event: {
          id: evento.id,
          titulo: evento.titulo,
          dataHora: evento.dataHora,
        },
      })),
    );

    return { data: escalasComEvento };
  } catch (error) {
    console.error("Erro ao buscar escalas:", error);
    return { data: [] };
  }
}

// 2. Buscar lista de voluntários (com limite de segurança)
export async function getVoluntarios(options?: { take?: number }) {
  const access = await getAccessContext();

  if (!access) {
    return { data: [] };
  }

  try {
    const voluntarios = await prisma.volunteer.findMany({
      where: {
        clerkUserId: access.ownerClerkUserId,
        ...(access.role === "LEADER"
          ? { ministries: { some: { id: access.ministryId } } }
          : {}),
      },
      orderBy: {
        nome: "asc",
      },
      take: options?.take ?? 500,
    });

    return { data: voluntarios };
  } catch (error) {
    console.error("Erro ao buscar voluntários:", error);
    return { data: [] };
  }
}

// CRIAR CULTO / EVENTO
export async function criarEvento(formData: FormData) {
  const access = await getAccessContext();
  if (!access) return { error: "Não autorizado" };

  const parsed = parseFormData(criarEventoSchema, formData);
  if ("error" in parsed) return parsed;
  const { titulo, dataHora } = parsed.data;

  const dataComFuso = new Date(`${dataHora}:00-03:00`);

  try {
    await prisma.event.create({
      data: {
        titulo,
        dataHora: dataComFuso,
        clerkUserId: access.ownerClerkUserId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return { error: "Erro ao criar evento." };
  }
}

// 4. Criar um novo evento com a primeira pessoa escalada
export async function criarEscala(formData: FormData) {
  const access = await getAccessContext();
  if (!access) return { error: "Acesso negado. Faça login para criar uma escala." };

  const parsed = parseFormData(criarEscalaSchema, formData);
  if ("error" in parsed) return parsed;
  const { tituloEvento, dataHora, volunteerId, funcaoEspecifica, ministryId } = parsed.data;

  try {
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        id: volunteerId,
        clerkUserId: access.ownerClerkUserId,
        ...(access.role === "LEADER"
          ? { ministries: { some: { id: access.ministryId } } }
          : {}),
      },
      select: { id: true },
    });
    if (!volunteer) {
      return { error: "Voluntário não pertence a este usuário." };
    }

    const evento = await prisma.event.create({
      data: {
        titulo: tituloEvento,
        dataHora: new Date(`${dataHora}:00-03:00`),
        clerkUserId: access.ownerClerkUserId,
      },
    });

    await prisma.schedule.create({
      data: {
        eventId: evento.id,
        volunteerId: volunteerId,
        funcaoEspecífica: funcaoEspecifica,
        status: "PENDENTE",
        ministryId:
          access.role === "LEADER"
            ? access.ministryId
            : ministryId || null,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar escala:", error);
    return { error: "Erro ao salvar a escala no banco." };
  }
}

// 5. Adicionar um novo voluntário a um evento JÁ EXISTENTE
export async function adicionarVoluntarioAoEvento(formData: FormData) {
  const access = await getAccessContext();
  if (!access) return { error: "Acesso negado." };

  const parsed = parseFormData(adicionarVoluntarioSchema, formData);
  if ("error" in parsed) return parsed;
  const { eventId, volunteerId, funcaoEspecifica } = parsed.data;

  try {
    const [event, volunteer] = await Promise.all([
      prisma.event.findFirst({
        where: {
          id: eventId,
          clerkUserId: access.ownerClerkUserId,
          ...(access.role === "LEADER"
            ? { escalas: { some: { ministryId: access.ministryId } } }
            : {}),
        },
        select: { id: true },
      }),
      prisma.volunteer.findFirst({
        where: {
          id: volunteerId,
          clerkUserId: access.ownerClerkUserId,
          ...(access.role === "LEADER"
            ? { ministries: { some: { id: access.ministryId } } }
            : {}),
        },
        select: { id: true },
      }),
    ]);
    if (!event || !volunteer) {
      return { error: "Evento ou voluntário não pertence a este usuário." };
    }

    await prisma.schedule.create({
      data: {
        eventId: eventId,
        volunteerId: volunteerId,
        funcaoEspecífica: funcaoEspecifica,
        status: "PENDENTE",
        ministryId: access.role === "LEADER" ? access.ministryId : null,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao adicionar voluntário ao evento:", error);
    return { error: "Não foi possível escalar o voluntário para este evento." };
  }
}

// 6. Atualizar o status da escala (Confirmado ou Recusado)
export async function responderEscala(
  id: string,
  novoStatus: "CONFIRMADO" | "RECUSADO",
  observacao?: string,
  token?: string,
) {
  const parsed = responderEscalaSchema.safeParse({ id, novoStatus, observacao, token });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  try {
    const tokenPayload = token ? verifyScheduleToken(token) : null;
    if (
      !tokenPayload ||
      tokenPayload.action === "PORTAL" ||
      tokenPayload.scheduleId !== id
    ) {
      return { error: "Link de resposta inválido ou expirado." };
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        event: true,
        volunteer: true,
        ministry: { include: { leaders: true } },
      },
    });

    if (!schedule || schedule.volunteerId !== tokenPayload.volunteerId) {
      return { error: "Link de resposta inválido." };
    }

    await prisma.schedule.update({
      where: { id },
      data: {
        status: novoStatus,
        observacao: observacao?.trim() || null,
      },
    });

    if (novoStatus === "RECUSADO") {
      const adminSettings = await prisma.userSettings.findUnique({
        where: { clerkUserId: schedule.event.clerkUserId },
        select: { telefoneLider: true },
      });
      const telefoneDestino =
        schedule.ministry?.leaders[0]?.telefone ||
        adminSettings?.telefoneLider ||
        process.env.ADMIN_WHATSAPP_PHONE;

      if (telefoneDestino) {
        let dataHoraTexto = "Horário não informado";
        if (schedule.event.dataHora) {
          const dateObj = new Date(schedule.event.dataHora);
          dataHoraTexto = dateObj.toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
          });
        }

        const motivoTexto = observacao?.trim()
          ? `"${observacao.trim()}"`
          : "Nenhum motivo informado";
        const funcao = schedule.funcaoEspecífica || "Serviço Geral";

        const mensagemLider =
          `⚠️ *ALERTA DE DESISTÊNCIA / IMPREVISTO*\n\n` +
          `Olá líder!* ${schedule.volunteer.nome}* informou que *NÃO poderá* cumprir a escala.\n\n` +
          `📌 *Culto:* ${schedule.event.titulo}\n` +
          `📅 *Data/Hora:* ${dataHoraTexto}\n` +
          `🛠️ *Função:* ${funcao}\n` +
          `💬 *Motivo:* ${motivoTexto}\n\n` +
          `🔄 Por favor, acesse o painel para escalar um substituto.`;

        await sendWhatsAppMessage({
          phone: telefoneDestino,
          message: mensagemLider,
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/confirmar/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status da escala:", error);
    return { error: "Não foi possível atualizar o status da escala." };
  }
}

// 7. Disparar notificação do voluntário diretamente via Evolution API
export async function notificarVoluntarioEscala(
  scheduleId: string,
  originUrl: string,
  nomeIgreja?: string,
) {
  const access = await getAccessContext();
  if (!access) return { error: "Acesso negado." };

  try {
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        event: { clerkUserId: access.ownerClerkUserId },
        ...(access.role === "LEADER" ? { ministryId: access.ministryId } : {}),
      },
      include: {
        volunteer: true,
        event: true,
      },
    });

    if (!schedule || !schedule.volunteer?.telefone) {
      return {
        error: "Voluntário ou telefone não encontrado para esta escala.",
      };
    }

    const links = await gerarLinksNotificacao(scheduleId);
    if ("error" in links) return links;

    const linkConfirmacao = `${originUrl}${links.confirmPath}`;
    const linkAgendaPessoal = schedule.volunteerId
      ? `${originUrl}${links.portalPath}`
      : "";

    let dataFormatada = "Data a definir";
    if (schedule.event.dataHora) {
      dataFormatada = new Date(schedule.event.dataHora).toLocaleDateString(
        "pt-BR",
        {
          timeZone: "America/Sao_Paulo",
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        },
      );
    }

    const funcao = schedule.funcaoEspecífica || "Serviço Geral";
    const linhaIgreja = nomeIgreja ? `⛪ *${nomeIgreja}*\n` : "";
    const linhaAgenda = linkAgendaPessoal
      ? `\n👀 *Ver todas as suas escalas:* ${linkAgendaPessoal}\n`
      : "";

    const mensagem =
      `*${linhaIgreja}*\n` +
      `Olá, *${schedule.volunteer.nome}*! 👋\n\n` +
      `Você foi escalado(a) para o culto:\n` +
      `📌 *${schedule.event.titulo}*\n` +
      `📅 *Data/Hora:* ${dataFormatada}\n` +
      `🛠️ *Função:* ${funcao}\n\n` +
      `Por favor, confirme sua presença ou avise se não poderá ir pelo link abaixo:\n` +
      `👉 ${linkConfirmacao}\n` +
      `${linhaAgenda}\n` +
      `Contamos com você! Deus abençoe.`;

    await sendWhatsAppMessage({
      phone: schedule.volunteer.telefone,
      message: mensagem,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao notificar voluntário via WhatsApp:", error);
    return { error: "Falha ao enviar mensagem via WhatsApp." };
  }
}

// 8. Excluir uma pessoa específica da escala
export async function excluirEscala(id: string) {
  const access = await getAccessContext();
  if (!access) {
    return { error: "Acesso negado." };
  }

  try {
    const schedule = await prisma.schedule.findFirst({
      where: {
        id,
        event: { clerkUserId: access.ownerClerkUserId },
        ...(access.role === "LEADER" ? { ministryId: access.ministryId } : {}),
      },
      select: { id: true },
    });
    if (!schedule) return { error: "Escala não encontrada." };

    await prisma.schedule.delete({ where: { id: schedule.id } });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir escala:", error);
    return { error: "Erro ao remover voluntário da escala." };
  }
}

// 9. Excluir o culto/evento completo e todas as pessoas vinculadas a ele
export async function excluirEvento(eventId: string) {
  const access = await getAccessContext();
  if (!access) {
    return { error: "Acesso negado. Faça login para realizar esta ação." };
  }
  try {
    const evento = await prisma.event.findFirst({
      where: {
        id: eventId,
        clerkUserId: access.ownerClerkUserId,
        ...(access.role === "LEADER"
          ? { escalas: { some: { ministryId: access.ministryId } } }
          : {}),
      },
      select: { id: true },
    });
    if (!evento) return { error: "Evento não encontrado." };

    await prisma.schedule.deleteMany({
      where: { eventId },
    });

    await prisma.event.delete({
      where: { id: eventId },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return { error: "Erro ao apagar o evento." };
  }
}

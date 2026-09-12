"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import {
  generateCompactScheduleToken,
  verifyScheduleToken,
} from "@/lib/tokens";

export async function gerarLinksNotificacao(scheduleId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Acesso negado." };

  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, event: { clerkUserId: userId } },
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

// 1. Buscar as escalas do próximo culto
export async function getEscalas() {
  const { userId } = await auth();

  if (!userId) {
    return { data: [] };
  }

  try {
    const eventos = await prisma.event.findMany({
      where: {
        clerkUserId: userId, // 👈 ISOLAMENTO: Só traz os cultos criados por este usuário
      },
      include: {
        escalas: {
          include: {
            volunteer: true,
          },
        },
      },
      orderBy: {
        dataHora: "asc",
      },
    });
    // 💡 INJETA O EVENTO EM CADA ESCALA ANTES DO FLATMAP
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

// 2. Buscar lista de voluntários (para preencher o Select do formulário)
export async function getVoluntarios() {
  const { userId } = await auth();

  if (!userId) {
    return { data: [] };
  }

  try {
    const voluntarios = await prisma.volunteer.findMany({
      where: {
        clerkUserId: userId, // 👈 ISOLAMENTO: Só traz os voluntários do usuário logado
      },
      orderBy: {
        nome: "asc",
      },
    });

    return { data: voluntarios };
  } catch (error) {
    console.error("Erro ao buscar voluntários:", error);
    return { data: [] };
  }
}

// CRIAR CULTO / EVENTO (Tratando Fuso Horário)
export async function criarEvento(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Não autorizado" };
  }

  const titulo = (formData.get("titulo") as string) || "Culto";
  const dataHoraInput = formData.get("dataHora") as string; // ex: "2026-09-08T19:41"

  if (!dataHoraInput) {
    return { error: "Data e hora são obrigatórias" };
  }

  // Ajusta a string ISO para o fuso do Brasil (-03:00) antes de converter para Date
  const dataComFuso = new Date(`${dataHoraInput}:00-03:00`);

  try {
    await prisma.event.create({
      data: {
        titulo,
        dataHora: dataComFuso,
        clerkUserId: userId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return { error: "Erro ao criar evento." };
  }
}

// 3. Criar novo voluntário
export async function criarVoluntario(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Acesso negado. Faça login para cadastrar um voluntário." };
  }

  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const departamento = formData.get("departamento") as string;

  if (!nome || !telefone || !departamento) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  try {
    await prisma.volunteer.create({
      data: {
        clerkUserId: userId,
        nome,
        telefone,
        departamento,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar voluntário:", error);
    return { error: "Erro ao salvar voluntário no banco de dados." };
  }
}

// 4. Criar um novo evento com a primeira pessoa escalada
export async function criarEscala(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Acesso negado. Faça login para criar uma escala." };
  }

  const tituloEvento = formData.get("tituloEvento") as string;
  const dataHora = formData.get("dataHora") as string;
  const volunteerId = formData.get("volunteerId") as string;
  const funcaoEspecifica = formData.get("funcaoEspecifica") as string;

  if (!tituloEvento || !dataHora || !volunteerId || !funcaoEspecifica) {
    return { error: "Preencha todos os campos do formulário." };
  }

  try {
    const volunteer = await prisma.volunteer.findFirst({
      where: { id: volunteerId, clerkUserId: userId },
      select: { id: true },
    });
    if (!volunteer) {
      return { error: "Voluntário não pertence a este usuário." };
    }

    // Cria o evento e já associa a primeira pessoa escalada
    const evento = await prisma.event.create({
      data: {
        titulo: tituloEvento,
        dataHora: new Date(`${dataHora}:00-03:00`),
        clerkUserId: userId,
      },
    });

    await prisma.schedule.create({
      data: {
        eventId: evento.id,
        volunteerId: volunteerId,
        funcaoEspecífica: funcaoEspecifica,
        status: "PENDENTE",
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
  const { userId } = await auth();
  const eventId = formData.get("eventId") as string;
  const volunteerId = formData.get("volunteerId") as string;
  const funcaoEspecifica = formData.get("funcaoEspecifica") as string;

  if (!userId) {
    return { error: "Acesso negado." };
  }

  if (!eventId || !volunteerId || !funcaoEspecifica) {
    return { error: "Selecione o voluntário e preencha a função." };
  }

  try {
    const [event, volunteer] = await Promise.all([
      prisma.event.findFirst({
        where: { id: eventId, clerkUserId: userId },
        select: { id: true },
      }),
      prisma.volunteer.findFirst({
        where: { id: volunteerId, clerkUserId: userId },
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
  try {
    const tokenPayload = token ? verifyScheduleToken(token) : null;
    if (
      !tokenPayload ||
      tokenPayload.action === "PORTAL" ||
      tokenPayload.scheduleId !== id
    ) {
      return { error: "Link de resposta inválido ou expirado." };
    }

    // 1. Valida a escala e o voluntário antes de alterar o status
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        event: true,
        volunteer: true,
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

    // 2. Se for RECUSADO, envia notificação no WhatsApp da liderança
    if (novoStatus === "RECUSADO") {
      // Usa o número do administrador/líder vindo das variáveis de ambiente
      const telefoneDestino = process.env.ADMIN_WHATSAPP_PHONE;

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
          `O voluntário *${schedule.volunteer.nome}* informou que *NÃO poderá ir* ao culto.\n\n` +
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

    // 3. Revalida as páginas do Next.js
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/confirmar/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status da escala:", error);
    return { error: "Não foi possível atualizar o status da escala." };
  }
}
// 7. Excluir uma pessoa específica da escala (Schedule)
export async function excluirEscala(id: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Acesso negado." };
  }

  try {
    const schedule = await prisma.schedule.findFirst({
      where: { id, event: { clerkUserId: userId } },
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

// 8. Excluir o culto/evento completo e todas as pessoas vinculadas a ele
export async function excluirEvento(eventId: string) {
  // 1. Trava de Segurança: Exige usuário logado
  const { userId } = await auth();
  if (!userId) {
    return { error: "Acesso negado. Faça login para realizar esta ação." };
  }
  try {
    const evento = await prisma.event.findFirst({
      where: { id: eventId, clerkUserId: userId },
      select: { id: true },
    });
    if (!evento) return { error: "Evento não encontrado." };

    // Garante a remoção das escalas vinculadas primeiro
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

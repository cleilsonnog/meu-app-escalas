"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

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
    // Cria o evento e já associa a primeira pessoa escalada
    const evento = await prisma.event.create({
      data: {
        titulo: tituloEvento,
        dataHora: new Date(dataHora),
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
  const eventId = formData.get("eventId") as string;
  const volunteerId = formData.get("volunteerId") as string;
  const funcaoEspecifica = formData.get("funcaoEspecifica") as string;

  if (!eventId || !volunteerId || !funcaoEspecifica) {
    return { error: "Selecione o voluntário e preencha a função." };
  }

  try {
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
) {
  try {
    await prisma.schedule.update({
      where: { id },
      data: { status: novoStatus, observacao: observacao?.trim() || null },
    });

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
  try {
    await prisma.schedule.delete({
      where: { id },
    });

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

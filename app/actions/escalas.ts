"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

// 1. Buscar as escalas do próximo culto
export async function getEscalas() {
  try {
    const escalas = await prisma.schedule.findMany({
      include: {
        volunteer: true,
        event: true,
      },
      orderBy: {
        event: {
          dataHora: "asc",
        },
      },
    });
    return { success: true, data: escalas };
  } catch (error) {
    console.error("Erro ao buscar escalas:", error);
    return { success: false, data: [] };
  }
}

// 2. Buscar lista de voluntários (para preencher o Select do formulário)
export async function getVoluntarios() {
  try {
    const voluntarios = await prisma.volunteer.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    });
    return { success: true, data: voluntarios };
  } catch (error) {
    console.error("Erro ao buscar voluntários:", error);
    return { success: false, data: [] };
  }
}

// 3. Criar novo voluntário
export async function criarVoluntario(formData: FormData) {
  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const departamento = formData.get("departamento") as string;

  if (!nome || !telefone || !departamento) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  try {
    await prisma.volunteer.create({
      data: {
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

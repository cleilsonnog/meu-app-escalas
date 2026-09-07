"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar voluntário:", error);
    return { error: "Erro ao salvar voluntário no banco de dados." };
  }
}

// 4. Criar um novo evento com a pessoa escalada
export async function criarEscala(formData: FormData) {
  const tituloEvento = formData.get("tituloEvento") as string;
  const dataHora = formData.get("dataHora") as string;
  const volunteerId = formData.get("volunteerId") as string;
  const funcaoEspecifica = formData.get("funcaoEspecifica") as string;

  if (!tituloEvento || !dataHora || !volunteerId || !funcaoEspecifica) {
    return { error: "Preencha todos os campos do formulário." };
  }

  try {
    // Cria ou reutiliza o evento e já associa a escala
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

    // Atualiza o cache do Next.js para refletir os novos dados na tela imediatamente
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar escala:", error);
    return { error: "Erro ao salvar a escala no banco." };
  }
}

// 5. Atualizar o status da escala (Confirmado ou Recusado)
export async function responderEscala(
  id: string,
  novoStatus: "CONFIRMADO" | "RECUSADO",
) {
  try {
    await prisma.schedule.update({
      where: { id },
      data: { status: novoStatus },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/confirmar/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status da escala:", error);
    return { error: "Não foi possível atualizar o status da escala." };
  }
}

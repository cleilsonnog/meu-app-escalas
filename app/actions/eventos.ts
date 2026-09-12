"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function getEventos() {
  const { userId } = await auth();
  if (!userId) return { data: [] };

  try {
    const eventos = await prisma.event.findMany({
      where: { clerkUserId: userId },
      orderBy: { dataHora: "asc" },
      include: {
        escalas: {
          include: {
            volunteer: true,
          },
        },
      },
    });
    return { data: eventos };
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return { error: "Falha ao carregar eventos." };
  }
}

export async function updateEvento(id: string, formData: FormData) {
  const { userId } = await auth();
  const titulo = (formData.get("titulo") as string)?.trim();
  const dataHoraStr = formData.get("dataHora") as string;

  if (!userId) {
    return { error: "Acesso negado." };
  }

  if (!titulo || !dataHoraStr) {
    return { error: "Título e Data/Hora são obrigatórios." };
  }

  try {
    const result = await prisma.event.updateMany({
      where: { id, clerkUserId: userId },
      data: {
        titulo,
        dataHora: new Date(dataHoraStr),
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return { error: "Não foi possível atualizar o evento." };
  }
}

export async function deleteEvento(id: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Acesso negado." };

  try {
    // Remove as escalas ligadas a esse evento primeiro
    await prisma.schedule.deleteMany({
      where: { eventId: id, event: { clerkUserId: userId } },
    });

    const result = await prisma.event.deleteMany({
      where: { id, clerkUserId: userId },
    });
    if (result.count === 0) return { error: "Evento não encontrado." };

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return { error: "Não foi possível excluir o evento." };
  }
}

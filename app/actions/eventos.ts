"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEventos() {
  try {
    const eventos = await prisma.event.findMany({
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
  const titulo = (formData.get("titulo") as string)?.trim();
  const dataHoraStr = formData.get("dataHora") as string;

  if (!titulo || !dataHoraStr) {
    return { error: "Título e Data/Hora são obrigatórios." };
  }

  try {
    await prisma.event.update({
      where: { id },
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
  try {
    // Remove as escalas ligadas a esse evento primeiro
    await prisma.schedule.deleteMany({
      where: { eventId: id },
    });

    await prisma.event.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return { error: "Não foi possível excluir o evento." };
  }
}

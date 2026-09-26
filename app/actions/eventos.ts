"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access";
import { updateEventoSchema, parseFormData } from "@/lib/validations";

export async function getEventos() {
  const access = await getAccessContext();
  if (!access) return { data: [] };

  try {
    const eventos = await prisma.event.findMany({
      where: {
        clerkUserId: access.ownerClerkUserId,
        ...(access.role === "LEADER"
          ? { escalas: { some: { ministryId: access.ministryId } } }
          : {}),
      },
      orderBy: { dataHora: "asc" },
      include: {
        escalas: {
          where:
            access.role === "LEADER"
              ? { ministryId: access.ministryId }
              : undefined,
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
  const access = await getAccessContext();
  if (!access) return { error: "Acesso negado." };

  const parsed = parseFormData(updateEventoSchema, formData);
  if ("error" in parsed) return parsed;
  const { titulo, dataHora: dataHoraStr } = parsed.data;

  try {
    const evento = await prisma.event.findFirst({
      where: {
        id,
        clerkUserId: access.ownerClerkUserId,
        ...(access.role === "LEADER"
          ? { escalas: { some: { ministryId: access.ministryId } } }
          : {}),
      },
      select: { id: true },
    });
    if (!evento) return { error: "Evento não encontrado." };

    await prisma.event.update({
      where: { id: evento.id },
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
  const access = await getAccessContext();
  if (!access) return { error: "Acesso negado." };

  try {
    const evento = await prisma.event.findFirst({
      where: {
        id,
        clerkUserId: access.ownerClerkUserId,
        ...(access.role === "LEADER"
          ? { escalas: { some: { ministryId: access.ministryId } } }
          : {}),
      },
      select: { id: true },
    });
    if (!evento) return { error: "Evento não encontrado." };

    await prisma.schedule.deleteMany({
      where: { eventId: evento.id },
    });

    await prisma.event.delete({
      where: { id: evento.id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return { error: "Não foi possível excluir o evento." };
  }
}

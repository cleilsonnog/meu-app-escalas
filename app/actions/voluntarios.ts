"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getAccessContext } from "@/lib/access";

export async function createVoluntario(formData: FormData) {
  const access = await getAccessContext();
  const nome = (formData.get("nome") as string)?.trim();
  const telefone = (formData.get("telefone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const departamento = (formData.get("departamento") as string)?.trim();

  if (!access) {
    return { error: "Usuário não autenticado." };
  }

  if (!nome || !telefone) {
    return { error: "Nome e Telefone/WhatsApp são obrigatórios." };
  }

  try {
    await prisma.volunteer.create({
      data: {
        clerkUserId: access.ownerClerkUserId,
        nome,
        telefone,
        departamento: departamento || "Geral",
        email,
        ...(access.role === "LEADER" && access.ministryId
          ? { ministries: { connect: { id: access.ministryId } } }
          : {}),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/voluntarios");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao salvar voluntário:", error);
    return { error: "Erro ao salvar voluntário no banco de dados." };
  }
}

export async function updateVoluntario(id: string, formData: FormData) {
  const { userId } = await auth();
  const nome = (formData.get("nome") as string)?.trim();
  const telefone = (formData.get("telefone") as string)?.trim();
  const departamento = (formData.get("departamento") as string)?.trim();

  if (!nome || !telefone) {
    return { error: "Nome e Telefone/WhatsApp são obrigatórios." };
  }

  if (!userId) {
    return { error: "Usuário não autenticado." };
  }

  try {
    const result = await prisma.volunteer.updateMany({
      where: { id, clerkUserId: userId },
      data: {
        nome,
        telefone,
        departamento: departamento || "Geral",
      },
    });

    if (result.count === 0) {
      return { error: "Voluntário não encontrado." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/voluntarios");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar voluntário:", error);
    return { error: "Erro ao atualizar voluntário no banco de dados." };
  }
}

export async function deleteVoluntario(id: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Usuário não autenticado." };
  }

  try {
    // Apaga escalas vinculadas ao voluntário primeiro para não violar a chave estrangeira
    await prisma.schedule.deleteMany({
      where: { volunteerId: id, volunteer: { clerkUserId: userId } },
    });

    const result = await prisma.volunteer.deleteMany({
      where: { id, clerkUserId: userId },
    });
    if (result.count === 0) {
      return { error: "Voluntário não encontrado." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/voluntarios");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir voluntário:", error);
    return { error: "Não foi possível excluir o voluntário." };
  }
}

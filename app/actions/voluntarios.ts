"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function createVoluntario(formData: FormData) {
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
    await prisma.volunteer.create({
      data: {
        clerkUserId: userId,
        nome,
        telefone,
        departamento: departamento || "Geral",
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
  const nome = (formData.get("nome") as string)?.trim();
  const telefone = (formData.get("telefone") as string)?.trim();
  const departamento = (formData.get("departamento") as string)?.trim();

  if (!nome || !telefone) {
    return { error: "Nome e Telefone/WhatsApp são obrigatórios." };
  }

  try {
    await prisma.volunteer.update({
      where: { id },
      data: {
        nome,
        telefone,
        departamento: departamento || "Geral",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/voluntarios");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar voluntário:", error);
    return { error: "Erro ao atualizar voluntário no banco de dados." };
  }
}

export async function deleteVoluntario(id: string) {
  try {
    // Apaga escalas vinculadas ao voluntário primeiro para não violar a chave estrangeira
    await prisma.schedule.deleteMany({
      where: { volunteerId: id },
    });

    await prisma.volunteer.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/voluntarios");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir voluntário:", error);
    return { error: "Não foi possível excluir o voluntário." };
  }
}

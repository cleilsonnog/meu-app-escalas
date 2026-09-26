"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAccessContext, volunteerWhere } from "@/lib/access";
import {
  createVoluntarioSchema,
  updateVoluntarioSchema,
  parseFormData,
} from "@/lib/validations";

export async function createVoluntario(formData: FormData) {
  const access = await getAccessContext();
  if (!access) return { error: "Usuário não autenticado." };

  const parsed = parseFormData(createVoluntarioSchema, formData);
  if ("error" in parsed) return parsed;
  const { nome, telefone, email, departamento } = parsed.data;

  try {
    await prisma.volunteer.create({
      data: {
        clerkUserId: access.ownerClerkUserId,
        nome,
        telefone,
        departamento,
        email: email || null,
        ...(access.role === "LEADER" && access.ministryId
          ? { ministries: { connect: { id: access.ministryId } } }
          : {}),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/voluntarios");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar voluntário:", error);
    return { error: "Erro ao salvar voluntário no banco de dados." };
  }
}

export async function updateVoluntario(id: string, formData: FormData) {
  const access = await getAccessContext();
  if (!access) return { error: "Usuário não autenticado." };

  const parsed = parseFormData(updateVoluntarioSchema, formData);
  if ("error" in parsed) return parsed;
  const { nome, telefone, departamento } = parsed.data;

  try {
    const result = await prisma.volunteer.updateMany({
      where: { id, ...volunteerWhere(access) },
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
  const access = await getAccessContext();
  if (!access) {
    return { error: "Usuário não autenticado." };
  }

  try {
    // Apaga escalas vinculadas ao voluntário primeiro para não violar a chave estrangeira
    await prisma.schedule.deleteMany({
      where: {
        volunteerId: id,
        volunteer: volunteerWhere(access),
      },
    });

    const result = await prisma.volunteer.deleteMany({
      where: { id, ...volunteerWhere(access) },
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

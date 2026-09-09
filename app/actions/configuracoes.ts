"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getIgrejaName() {
  try {
    const { userId } = await auth();
    if (!userId) return "";

    const config = await prisma.userSettings.findUnique({
      where: { clerkUserId: userId },
    });

    return config?.churchName || "";
  } catch (error) {
    console.error("Erro ao buscar nome da igreja:", error);
    return "";
  }
}

export async function salvarIgrejaName(churchName: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Não autorizado" };

    await prisma.userSettings.upsert({
      where: { clerkUserId: userId },
      update: { churchName },
      create: {
        clerkUserId: userId,
        churchName,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar nome da igreja:", error);
    return { error: "Falha ao salvar" };
  }
}

"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access";

export async function getIgrejaName() {
  try {
    const access = await getAccessContext();
    if (!access) return "";

    const config = await prisma.userSettings.findUnique({
      where: { clerkUserId: access.ownerClerkUserId },
    });

    return config?.churchName || "";
  } catch (error) {
    console.error("Erro ao buscar nome da igreja:", error);
    return "";
  }
}

export async function salvarIgrejaName(churchName: string) {
  try {
    const access = await getAccessContext();
    if (!access || access.role !== "ADMIN") return { error: "Não autorizado" };

    await prisma.userSettings.upsert({
      where: { clerkUserId: access.ownerClerkUserId },
      update: { churchName },
      create: {
        clerkUserId: access.ownerClerkUserId,
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

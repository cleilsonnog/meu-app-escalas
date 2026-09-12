"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access";
import { revalidatePath } from "next/cache";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

async function requireAdmin() {
  const access = await getAccessContext();
  return access?.role === "ADMIN" ? access : null;
}

export async function getAdministracao() {
  const access = await requireAdmin();
  if (!access) return { error: "Acesso negado." };

  const [ministries, leaders, schedules] = await Promise.all([
    prisma.ministry.findMany({
      where: { clerkUserId: access.ownerClerkUserId },
      include: {
        leaders: true,
        _count: { select: { volunteers: true, escalas: true } },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.volunteer.findMany({
      where: {
        clerkUserId: access.ownerClerkUserId,
        ledMinistries: { some: {} },
      },
      include: { ledMinistries: { select: { id: true, nome: true } } },
      orderBy: { nome: "asc" },
    }),
    prisma.schedule.findMany({
      where: { event: { clerkUserId: access.ownerClerkUserId } },
      include: {
        volunteer: { select: { nome: true } },
        event: { select: { titulo: true, dataHora: true } },
        ministry: {
          include: { leaders: { select: { id: true, nome: true } } },
        },
      },
      orderBy: { event: { dataHora: "asc" } },
    }),
  ]);

  return { ministries, leaders, schedules };
}

export async function criarMinisterio(formData: FormData) {
  const access = await requireAdmin();
  if (!access) return { error: "Acesso negado." };

  const nome = String(formData.get("nome") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  if (!nome) return { error: "Informe o nome do ministério." };

  try {
    await prisma.ministry.create({
      data: { nome, descricao, clerkUserId: access.ownerClerkUserId },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Não foi possível criar o ministério." };
  }
}

export async function atualizarMinisterio(id: string, formData: FormData) {
  const access = await requireAdmin();
  if (!access) return { error: "Acesso negado." };

  const nome = String(formData.get("nome") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  if (!nome) return { error: "Informe o nome do ministério." };

  const result = await prisma.ministry.updateMany({
    where: { id, clerkUserId: access.ownerClerkUserId },
    data: { nome, descricao },
  });
  if (!result.count) return { error: "Ministério não encontrado." };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function excluirMinisterio(id: string) {
  const access = await requireAdmin();
  if (!access) return { error: "Acesso negado." };

  const ministry = await prisma.ministry.findFirst({
    where: { id, clerkUserId: access.ownerClerkUserId },
    select: { id: true, nome: true },
  });
  if (!ministry) return { error: "Ministério não encontrado." };
  if (ministry.nome === "Obreiros")
    return { error: "O ministério inicial não pode ser excluído." };

  await prisma.ministry.delete({ where: { id: ministry.id } });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function cadastrarLider(formData: FormData) {
  const access = await requireAdmin();
  if (!access) return { error: "Acesso negado." };

  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const telefone = String(formData.get("telefone") || "").trim();
  const ministryId = String(formData.get("ministryId") || "");
  if (!nome || !email || !telefone || !ministryId) {
    return { error: "Nome, e-mail, telefone e ministério são obrigatórios." };
  }

  const ministry = await prisma.ministry.findFirst({
    where: { id: ministryId, clerkUserId: access.ownerClerkUserId },
    select: { id: true },
  });
  if (!ministry) return { error: "Ministério inválido." };

  try {
    const leader = await prisma.volunteer.create({
      data: {
        clerkUserId: access.ownerClerkUserId,
        nome,
        email,
        telefone,
        departamento: "Liderança",
        ministries: { connect: { id: ministry.id } },
      },
    });

    await prisma.ministry.update({
      where: { id: ministry.id },
      data: { leaders: { connect: { id: leader.id } } },
    });

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
    const invitation = await (
      await clerkClient()
    ).invitations.createInvitation({
      emailAddress: email,
      expiresInDays: 7,
      redirectUrl: `${baseUrl}/leader/activate/${leader.id}`,
      publicMetadata: { leaderId: leader.id },
    });

    if (!invitation.url) {
      throw new Error("O Clerk não retornou a URL do convite.");
    }

    await sendWhatsAppMessage({
      phone: telefone,
      message:
        `Olá, *${nome}*! Você foi cadastrado como líder do ministério.\n\n` +
        `Acesse o link abaixo para aceitar o convite e criar ou acessar sua conta:\n` +
        `👉 ${invitation.url}\n\n` +
        `Este convite expira em 7 dias.`,
    });

    revalidatePath("/dashboard");
    return { success: true, invitationUrl: invitation.url };
  } catch (error) {
    console.error("Erro ao cadastrar líder:", error);
    return { error: "Não foi possível cadastrar ou convidar o líder." };
  }
}

export async function atualizarLider(id: string, formData: FormData) {
  const access = await requireAdmin();
  if (!access) return { error: "Acesso negado." };

  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const telefone = String(formData.get("telefone") || "").trim();
  const ministryId = String(formData.get("ministryId") || "");
  if (!nome || !email || !telefone || !ministryId)
    return { error: "Preencha todos os campos." };

  const [leader, ministry] = await Promise.all([
    prisma.volunteer.findFirst({
      where: { id, clerkUserId: access.ownerClerkUserId },
      select: { id: true },
    }),
    prisma.ministry.findFirst({
      where: { id: ministryId, clerkUserId: access.ownerClerkUserId },
      select: { id: true },
    }),
  ]);
  if (!leader || !ministry)
    return { error: "Líder ou ministério não encontrado." };

  await prisma.$transaction([
    prisma.volunteer.update({
      where: { id },
      data: {
        nome,
        email,
        telefone,
        ministries: { set: [{ id: ministry.id }] },
        ledMinistries: { set: [{ id: ministry.id }] },
      },
    }),
  ]);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function excluirLider(id: string) {
  const access = await requireAdmin();
  if (!access) return { error: "Acesso negado." };

  const leader = await prisma.volunteer.findFirst({
    where: { id, clerkUserId: access.ownerClerkUserId },
    select: { id: true },
  });
  if (!leader) return { error: "Líder não encontrado." };

  await prisma.$transaction([
    prisma.schedule.deleteMany({ where: { volunteerId: id } }),
    prisma.volunteer.delete({ where: { id } }),
  ]);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function ativarContaLider(leaderId: string) {
  const { userId } = await import("@clerk/nextjs/server").then(({ auth }) =>
    auth(),
  );
  if (!userId) return { error: "Faça login ou crie sua conta pelo convite." };

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (!email) return { error: "Sua conta não possui e-mail principal." };

  const leader = await prisma.volunteer.findFirst({
    where: { id: leaderId, email },
    select: { id: true },
  });
  if (!leader)
    return { error: "Este convite não corresponde ao e-mail da conta." };

  await prisma.volunteer.update({
    where: { id: leader.id },
    data: { accessClerkUserId: userId },
  });
  revalidatePath("/dashboard");
  return { success: true };
}

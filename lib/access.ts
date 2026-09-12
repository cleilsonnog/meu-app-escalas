import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export type AccessRole = "ADMIN" | "LEADER";

export interface AccessContext {
  clerkUserId: string;
  ownerClerkUserId: string;
  role: AccessRole;
  volunteerId?: string;
  ministryId?: string;
  ministryName?: string;
}

export async function getAccessContext(): Promise<AccessContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const adminSettings = await prisma.userSettings.findUnique({
    where: { clerkUserId: userId },
    select: { clerkUserId: true, role: true },
  });

  if (adminSettings?.role === "ADMIN") {
    return {
      clerkUserId: userId,
      ownerClerkUserId: userId,
      role: "ADMIN",
    };
  }

  const leader = await prisma.volunteer.findUnique({
    where: { accessClerkUserId: userId },
    select: {
      id: true,
      clerkUserId: true,
      ledMinistries: {
        select: { id: true, nome: true },
        take: 1,
      },
    },
  });

  const ministry = leader?.ledMinistries[0];
  if (leader && ministry) {
    return {
      clerkUserId: userId,
      ownerClerkUserId: leader.clerkUserId,
      role: "LEADER",
      volunteerId: leader.id,
      ministryId: ministry.id,
      ministryName: ministry.nome,
    };
  }

  if (leader) return null;

  const settings = await prisma.userSettings.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: { clerkUserId: userId, churchName: "Minha Igreja", role: "ADMIN" },
    select: { clerkUserId: true },
  });

  return {
    clerkUserId: userId,
    ownerClerkUserId: userId,
    role: "ADMIN",
  };
}

export function ownerWhere(access: AccessContext) {
  return { clerkUserId: access.ownerClerkUserId };
}

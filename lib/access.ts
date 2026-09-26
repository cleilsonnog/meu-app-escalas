import { auth, currentUser } from "@clerk/nextjs/server";
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

  const user = await currentUser();
  const invitationLeaderId =
    typeof user?.publicMetadata?.leaderId === "string"
      ? user.publicMetadata.leaderId
      : null;
  const accountEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  let leader = await prisma.volunteer.findFirst({
    where: {
      OR: [
        { accessClerkUserId: userId },
        ...(invitationLeaderId ? [{ id: invitationLeaderId }] : []),
        ...(accountEmail
          ? [{ email: accountEmail, accessClerkUserId: null }]
          : []),
      ],
    },
    select: {
      id: true,
      clerkUserId: true,
      accessClerkUserId: true,
      email: true,
      ledMinistries: {
        select: { id: true, nome: true },
        take: 1,
      },
    },
  });

  if (leader && leader.accessClerkUserId !== userId) {
    leader = await prisma.volunteer.update({
      where: { id: leader.id },
      data: { accessClerkUserId: userId },
      select: {
        id: true,
        clerkUserId: true,
        accessClerkUserId: true,
        email: true,
        ledMinistries: {
          select: { id: true, nome: true },
          take: 1,
        },
      },
    });
    await prisma.userSettings.deleteMany({ where: { clerkUserId: userId } });
  }

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

/** Filtro base de tenant — todo model com clerkUserId deve usar isso. */
export function ownerWhere(access: AccessContext) {
  return { clerkUserId: access.ownerClerkUserId };
}

/** Filtro de voluntário: restringe por ministério se for líder. */
export function volunteerWhere(access: AccessContext) {
  return {
    clerkUserId: access.ownerClerkUserId,
    ...(access.role === "LEADER"
      ? { ministries: { some: { id: access.ministryId } } }
      : {}),
  };
}

/** Filtro de evento: restringe por ministério se for líder. */
export function eventWhere(access: AccessContext) {
  return {
    clerkUserId: access.ownerClerkUserId,
    ...(access.role === "LEADER"
      ? { escalas: { some: { ministryId: access.ministryId } } }
      : {}),
  };
}

/** Filtro de escala por ministério (para queries de Schedule). */
export function scheduleMinistryFilter(access: AccessContext) {
  return access.role === "LEADER" ? { ministryId: access.ministryId } : {};
}

/** ministryId para novas escalas. */
export function scheduleMinistryId(access: AccessContext, fallback?: string | null) {
  return access.role === "LEADER" ? access.ministryId : fallback ?? null;
}

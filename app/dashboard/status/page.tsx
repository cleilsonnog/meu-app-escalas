import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import pkg from "@/package.json";
import { StatusClient } from "./status-client";

const APP_ROUTES = [
  { path: "/", desc: "Landing page", auth: false },
  { path: "/sign-in", desc: "Login", auth: false },
  { path: "/sign-up", desc: "Cadastro", auth: false },
  { path: "/dashboard", desc: "Painel principal (tabs: escalas, voluntarios, relatorios, administracao)", auth: true },
  { path: "/dashboard/status", desc: "Status do sistema e versionamento", auth: true },
  { path: "/confirmar/[id]", desc: "Voluntario confirma/recusa escala", auth: false },
  { path: "/voluntario/[id]", desc: "Agenda pessoal do voluntario", auth: false },
  { path: "/leader/activate/[id]", desc: "Ativacao de conta de lider", auth: false },
  { path: "/r/[token]", desc: "Redirect de tokens compactos", auth: false },
  { path: "/schedules/status", desc: "Status de escalas via token", auth: false },
  { path: "API /api/cron/send-reminders", desc: "Cron job para envio de lembretes WhatsApp", auth: false },
  { path: "API /api/schedules/respond", desc: "Resposta de escala via API", auth: false },
];

async function checkDbHealth(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

async function getDbStats() {
  try {
    const [volunteers, events, schedules, ministries] = await Promise.all([
      prisma.volunteer.count(),
      prisma.event.count(),
      prisma.schedule.count(),
      prisma.ministry.count(),
    ]);
    return { volunteers, events, schedules, ministries };
  } catch {
    return null;
  }
}

export default async function StatusPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const settings = await prisma.userSettings.findUnique({
    where: { clerkUserId: userId },
    select: { role: true },
  });
  if (settings?.role !== "ADMIN") redirect("/dashboard");

  const [dbHealth, dbStats] = await Promise.all([
    checkDbHealth(),
    getDbStats(),
  ]);

  return (
    <StatusClient
      version={pkg.version}
      routes={APP_ROUTES}
      dbHealth={dbHealth}
      dbStats={dbStats}
      env={process.env.NODE_ENV || "development"}
      region={process.env.VERCEL_REGION || "local"}
    />
  );
}

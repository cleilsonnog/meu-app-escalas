"use client";

import { useState } from "react";
import Link from "next/link";

interface Route {
  path: string;
  desc: string;
  auth: boolean;
}

interface Props {
  version: string;
  routes: Route[];
  dbHealth: { ok: boolean; latencyMs: number };
  dbStats: { volunteers: number; events: number; schedules: number; ministries: number } | null;
  env: string;
  region: string;
}

const CHANGELOG_URL = "https://github.com/seu-usuario/meu-app-escalas/blob/main/CHANGELOG.md";

export function StatusClient({ version, routes, dbHealth, dbStats, env, region }: Props) {
  const [major, minor, patch] = version.split(".").map(Number);
  const [tab, setTab] = useState<"overview" | "routes" | "changelog">("overview");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Status do Sistema
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitoramento e documentacao do Escalas SaaS
          </p>
        </div>
        <Link
          href="/dashboard"
          className="w-fit rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Voltar ao painel
        </Link>
      </div>

      {/* Version Card */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
            v{major}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                v{version}
              </span>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                stable
              </span>
            </div>
            <div className="mt-1 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>Major: <strong>{major}</strong> (breaking changes)</span>
              <span>Minor: <strong>{minor}</strong> (novas features)</span>
              <span>Patch: <strong>{patch}</strong> (bug fixes)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <HealthCard
          label="Database"
          status={dbHealth.ok}
          detail={`${dbHealth.latencyMs}ms`}
        />
        <HealthCard
          label="Ambiente"
          status={true}
          detail={env}
        />
        <HealthCard
          label="Regiao"
          status={true}
          detail={region}
        />
        <HealthCard
          label="Node.js"
          status={true}
          detail={`v${process.versions?.node || "N/A"}`}
        />
      </div>

      {/* DB Stats */}
      {dbStats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Voluntarios" value={dbStats.volunteers} />
          <StatCard label="Eventos" value={dbStats.events} />
          <StatCard label="Escalas" value={dbStats.schedules} />
          <StatCard label="Ministerios" value={dbStats.ministries} />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(["overview", "routes", "changelog"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t === "overview" ? "Visao Geral" : t === "routes" ? "Rotas" : "Changelog"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {tab === "overview" && <OverviewTab env={env} region={region} version={version} />}
        {tab === "routes" && <RoutesTab routes={routes} />}
        {tab === "changelog" && <ChangelogTab />}
      </div>
    </div>
  );
}

function HealthCard({ label, status, detail }: { label: string; status: boolean; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${status ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function OverviewTab({ env, region, version }: { env: string; region: string; version: string }) {
  const items = [
    { label: "Framework", value: "Next.js 14.2 (App Router)" },
    { label: "Banco de Dados", value: "PostgreSQL (Neon) via Prisma 7" },
    { label: "Autenticacao", value: "Clerk" },
    { label: "Mensageria", value: "Evolution API (WhatsApp)" },
    { label: "Deploy", value: "Vercel" },
    { label: "Testes", value: "Vitest" },
    { label: "Validacao", value: "Zod" },
    { label: "Versao", value: `v${version}` },
    { label: "Ambiente", value: env },
    { label: "Regiao", value: region },
  ];

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between px-6 py-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function RoutesTab({ routes }: { routes: Route[] }) {
  const pages = routes.filter((r) => !r.path.startsWith("API"));
  const apis = routes.filter((r) => r.path.startsWith("API"));

  return (
    <div className="p-6">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
        Paginas ({pages.length})
      </h3>
      <div className="mb-6 space-y-2">
        {pages.map((r) => (
          <div key={r.path} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-2.5 dark:bg-slate-800/50">
            <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{r.path}</code>
            {r.auth && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                AUTH
              </span>
            )}
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{r.desc}</span>
          </div>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
        API Routes ({apis.length})
      </h3>
      <div className="space-y-2">
        {apis.map((r) => (
          <div key={r.path} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-2.5 dark:bg-slate-800/50">
            <code className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
              {r.path.replace("API ", "")}
            </code>
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangelogTab() {
  return (
    <div className="p-6">
      <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">v1.0.0 — 2026-09-26</h3>
        <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">Release inicial com todas as features core do SaaS.</p>
      </div>

      <div className="space-y-4">
        <ChangelogSection
          title="Adicionado"
          color="green"
          items={[
            "Validacao com Zod em todas as server actions",
            "Testes unitarios com Vitest (29 testes)",
            "Helpers centralizados de tenant filtering",
            "Notificacoes WhatsApp nao-bloqueantes (fire-and-forget)",
            "Pagina de status do sistema com versionamento semantico",
          ]}
        />
        <ChangelogSection
          title="Corrigido"
          color="red"
          items={[
            "Isolamento multi-tenant no eventos.ts",
            "Queries sem limite retornando todos os registros",
            "Proximo culto em destaque mostrando evento antigo",
            "Erros de TypeScript em todos os componentes",
            "Campo funcaoEspecifica com acento causando problemas",
          ]}
        />
        <ChangelogSection
          title="Alterado"
          color="amber"
          items={[
            "Reorganizacao de componentes dashboard com subpasta modals/",
            "Dashboard carrega dados condicionalmente por tab",
            "Versao bumped de 0.1.0 para 1.0.0",
          ]}
        />
      </div>
    </div>
  );
}

function ChangelogSection({
  title,
  color,
  items,
}: {
  title: string;
  color: "green" | "red" | "amber";
  items: string[];
}) {
  const colors = {
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div>
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>
        {title}
      </span>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

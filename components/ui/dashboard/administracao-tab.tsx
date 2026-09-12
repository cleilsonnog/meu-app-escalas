"use client";

import { useState } from "react";
import {
  cadastrarLider,
  criarMinisterio,
  excluirMinisterio,
  excluirLider,
  atualizarLider,
} from "@/app/actions/administracao";

interface Ministry {
  id: string;
  nome: string;
  descricao: string | null;
  leaders: { id: string; nome: string }[];
  _count: { volunteers: number; escalas: number };
}

interface Leader {
  id: string;
  nome: string;
  email: string | null;
  telefone: string;
  ledMinistries: { id: string; nome: string }[];
}

export function AdministracaoTab({
  ministries,
  leaders,
  schedules,
}: {
  ministries: Ministry[];
  leaders: Leader[];
  schedules: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [convite, setConvite] = useState("");
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [ministryFilter, setMinistryFilter] = useState("TODOS");
  const [leaderFilter, setLeaderFilter] = useState("TODOS");
  const [monthFilter, setMonthFilter] = useState("TODOS");

  const filteredSchedules = schedules.filter((schedule) => {
    const ministryId = schedule.ministry?.id || "SEM_MINISTERIO";
    const leaderIds = (schedule.ministry?.leaders || []).map((leader: { id: string }) => leader.id);
    const month = new Date(schedule.event.dataHora).getMonth().toString();
    return (
      (ministryFilter === "TODOS" || ministryFilter === ministryId) &&
      (leaderFilter === "TODOS" || leaderIds.includes(leaderFilter)) &&
      (monthFilter === "TODOS" || monthFilter === month)
    );
  });

  async function submit(
    action: (
      data: FormData,
    ) => Promise<{ error?: string; success?: boolean; invitationUrl?: string }>,
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setLoading(true);
    const result = await action(new FormData(event.currentTarget));
    setLoading(false);
    if (result.error) alert(result.error);
    if (result.invitationUrl) {
      setConvite(result.invitationUrl);
      event.currentTarget.reset();
    }
  }

  async function removeMinistry(id: string, nome: string) {
    if (!confirm(`Excluir o ministério "${nome}"?`)) return;
    const result = await excluirMinisterio(id);
    if (result.error) alert(result.error);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={(event) => submit(criarMinisterio, event)}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="font-semibold">Novo ministério</h3>
          <input
            name="nome"
            required
            placeholder="Nome do ministério"
            className="w-full rounded-lg border p-2 text-sm"
          />
          <input
            name="descricao"
            placeholder="Descrição (opcional)"
            className="w-full rounded-lg border p-2 text-sm"
          />
          <button
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Cadastrar ministério
          </button>
        </form>

        <form
          onSubmit={(event) => submit(cadastrarLider, event)}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="font-semibold">Cadastrar líder e enviar convite</h3>
          <input
            name="nome"
            required
            placeholder="Nome completo"
            className="w-full rounded-lg border p-2 text-sm"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="E-mail do líder"
            className="w-full rounded-lg border p-2 text-sm"
          />
          <input
            name="telefone"
            required
            placeholder="WhatsApp / telefone"
            className="w-full rounded-lg border p-2 text-sm"
          />
          <select
            name="ministryId"
            required
            className="w-full rounded-lg border p-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Selecione o ministério
            </option>
            {ministries.map((ministry) => (
              <option key={ministry.id} value={ministry.id}>
                {ministry.nome}
              </option>
            ))}
          </select>
          <button
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Enviar convite
          </button>
          {convite && (
            <p className="break-all rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">
              Convite criado: {convite}
            </p>
          )}
        </form>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 font-semibold">Ministérios cadastrados</h3>
        <div className="divide-y">
          {ministries.map((ministry) => (
            <div
              key={ministry.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
            >
              <div>
                <strong>{ministry.nome}</strong>
                <p className="text-xs text-slate-500">
                  Líderes: {ministry.leaders.map((leader) => leader.nome).join(", ") || "Não definido"} ·{" "}
                  {ministry._count.volunteers} voluntários ·{" "}
                  {ministry._count.escalas} escalas
                </p>
              </div>
              <button
                onClick={() => removeMinistry(ministry.id, ministry.nome)}
                className="text-xs text-red-600"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold">Todas as escalas da igreja</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            value={ministryFilter}
            onChange={(event) => setMinistryFilter(event.target.value)}
            className="rounded-lg border p-2 text-sm"
          >
            <option value="TODOS">Todos os ministérios</option>
            {ministries.map((ministry) => (
              <option key={ministry.id} value={ministry.id}>
                {ministry.nome}
              </option>
            ))}
          </select>
          <select
            value={leaderFilter}
            onChange={(event) => setLeaderFilter(event.target.value)}
            className="rounded-lg border p-2 text-sm"
          >
            <option value="TODOS">Todos os líderes</option>
            {leaders.map((leader) => (
              <option key={leader.id} value={leader.id}>
                {leader.nome}
              </option>
            ))}
          </select>
          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="rounded-lg border p-2 text-sm"
          >
            <option value="TODOS">Todos os meses</option>
            {[
              "Janeiro",
              "Fevereiro",
              "Março",
              "Abril",
              "Maio",
              "Junho",
              "Julho",
              "Agosto",
              "Setembro",
              "Outubro",
              "Novembro",
              "Dezembro",
            ].map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div className="divide-y">
          {filteredSchedules.map((schedule) => (
            <div key={schedule.id} className="py-3 text-sm">
              <strong>{schedule.event.titulo}</strong> ·{" "}
              {schedule.volunteer.nome}
              <p className="text-xs text-slate-500">
                {new Date(schedule.event.dataHora).toLocaleDateString("pt-BR")}{" "}
                · {schedule.ministry?.nome || "Sem ministério"} ·{" "}
                {(schedule.ministry?.leaders || []).map((leader: { nome: string }) => leader.nome).join(", ") || "Sem líder"} ·{" "}
                {schedule.status}
              </p>
            </div>
          ))}
          {!filteredSchedules.length && (
            <p className="py-4 text-sm text-slate-500">
              Nenhuma escala encontrada.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 font-semibold">Líderes cadastrados</h3>
        <div className="divide-y">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <div>
                <strong>{leader.nome}</strong>
                <p className="text-xs text-slate-500">
                  {leader.email} ·{" "}
                  {leader.ledMinistries
                    .map((ministry) => ministry.nome)
                    .join(", ") || "Sem ministério"}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingLeader(leader)}
                  className="text-xs text-indigo-600"
                >
                  Editar
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`Excluir ${leader.nome}?`)) {
                      const result = await excluirLider(leader.id);
                      if (result.error) alert(result.error);
                    }
                  }}
                  className="text-xs text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {editingLeader && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await atualizarLider(
              editingLeader.id,
              new FormData(event.currentTarget),
            );
            if (result.error) alert(result.error);
            else setEditingLeader(null);
          }}
          className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30"
        >
          <h3 className="font-semibold">Editar líder</h3>
          <input
            name="nome"
            defaultValue={editingLeader.nome}
            required
            className="w-full rounded-lg border p-2 text-sm"
          />
          <input
            name="email"
            type="email"
            defaultValue={editingLeader.email || ""}
            required
            className="w-full rounded-lg border p-2 text-sm"
          />
          <input
            name="telefone"
            defaultValue={editingLeader.telefone}
            required
            className="w-full rounded-lg border p-2 text-sm"
          />
          <select
            name="ministryId"
            required
            defaultValue={editingLeader.ledMinistries[0]?.id || ""}
            className="w-full rounded-lg border p-2 text-sm"
          >
            {ministries.map((ministry) => (
              <option key={ministry.id} value={ministry.id}>
                {ministry.nome}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setEditingLeader(null)}
            className="mr-2 rounded-lg border px-3 py-2 text-sm"
          >
            Cancelar
          </button>
          <button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">
            Salvar
          </button>
        </form>
      )}
    </div>
  );
}

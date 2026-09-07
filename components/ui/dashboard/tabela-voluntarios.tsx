"use client";

import { useState } from "react";
import { updateVoluntario, deleteVoluntario } from "@/app/actions/voluntarios";

interface Volunteer {
  id: string;
  nome: string;
  telefone: string;
  departamento: string;
}

interface Props {
  voluntarios: Volunteer[];
}

export function TabelaVoluntarios({ voluntarios }: Props) {
  const [voluntarioEditando, setVoluntarioEditando] =
    useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");

  const listaFiltrada = voluntarios.filter(
    (v) =>
      v.nome.toLowerCase().includes(busca.toLowerCase()) ||
      v.departamento.toLowerCase().includes(busca.toLowerCase()) ||
      v.telefone.includes(busca),
  );

  async function handleSalvarEdicao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!voluntarioEditando) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateVoluntario(voluntarioEditando.id, formData);

    if (res.success) {
      setVoluntarioEditando(null);
    } else {
      alert(res.error || "Erro ao atualizar");
    }
    setLoading(false);
  }

  async function handleExcluir(id: string, nome: string) {
    if (
      confirm(
        `Tem certeza que deseja excluir "${nome}"? Todas as escalas associadas a este voluntário também serão removidas.`,
      )
    ) {
      setLoading(true);
      const res = await deleteVoluntario(id);
      if (!res.success) {
        alert(res.error || "Erro ao excluir");
      }
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <input
          type="text"
          placeholder="Buscar por nome, departamento ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full max-w-md px-3 py-2 text-sm border rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-xs text-muted-foreground">
          Total: {listaFiltrada.length} voluntários
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Telefone / Whats</th>
              <th className="p-4">Departamento</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {listaFiltrada.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground"
                >
                  Nenhum voluntário encontrado.
                </td>
              </tr>
            ) : (
              listaFiltrada.map((vol) => (
                <tr
                  key={vol.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                >
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                    {vol.nome}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">
                    {vol.telefone}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                      {vol.departamento}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setVoluntarioEditando(vol)}
                      className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(vol.id, vol.nome)}
                      disabled={loading}
                      className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      {voluntarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4">Editar Voluntário</h3>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nome"
                  defaultValue={voluntarioEditando.nome}
                  required
                  className="w-full p-2 text-sm border rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  WhatsApp / Telefone *
                </label>
                <input
                  type="tel"
                  name="telefone"
                  defaultValue={voluntarioEditando.telefone}
                  required
                  className="w-full p-2 text-sm border rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  name="departamento"
                  defaultValue={voluntarioEditando.departamento}
                  className="w-full p-2 text-sm border rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setVoluntarioEditando(null)}
                  className="px-4 py-2 text-sm font-medium border rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Salva..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

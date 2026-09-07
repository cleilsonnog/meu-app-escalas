"use client";

import { useState } from "react";
import { createVoluntario } from "@/app/actions/voluntarios";

export function NovoVoluntarioModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const result = await createVoluntario(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      setIsOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-3 py-2.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition text-center whitespace-nowrap"
      >
        + Voluntário
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-lg p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4">
              Cadastrar Novo Voluntário
            </h3>

            {errorMsg && (
              <div className="mb-4 p-2 text-sm text-red-600 bg-red-100 rounded">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  placeholder="Ex: Honório Silva"
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
                  required
                  placeholder="Ex: +5522988516223"
                  className="w-full p-2 text-sm border rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Com DDD (ex: +55...)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">E-mail</label>
                <input
                  type="email"
                  name="email"
                  placeholder="exemplo@email.com"
                  className="w-full p-2 text-sm border rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Departamento / Função Principal
                </label>
                <input
                  type="text"
                  name="departamento"
                  placeholder="Ex: Mídia, Louvor, Recepção, Diaconato"
                  className="w-full p-2 text-sm border rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium border rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Salvar Voluntário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

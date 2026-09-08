"use client";

import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Ou a sua biblioteca de Modal/Dialog
import { adicionarVoluntarioAEscala } from "@/app/actions/escalas";

interface VoluntarioOption {
  id: string;
  nome: string;
  departamento?: string;
}

interface Props {
  escalaId: string;
  nomeCulto: string;
  voluntarios: VoluntarioOption[];
}

export function AdicionarVoluntarioModal({
  escalaId,
  nomeCulto,
  voluntarios,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.append("escalaId", escalaId);

    const result = await adicionarVoluntarioAEscala(formData);

    setLoading(false);
    if (result.success) {
      setOpen(false);
    } else {
      alert(result.error || "Erro ao adicionar voluntário");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg transition">
        <UserPlus className="h-3.5 w-3.5" />
        <span>+ Add Voluntário</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Escalar Voluntário
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Adicionando voluntário para:{" "}
            <strong className="text-indigo-600">{nomeCulto}</strong>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Seletor de Voluntário */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Selecione o Voluntário
            </label>
            <select
              name="voluntarioId"
              required
              className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Escolha um voluntário...</option>
              {voluntarios.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome} {v.departamento ? `(${v.departamento})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Função / Ministério */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Função no Culto
            </label>
            <input
              type="text"
              name="funcao"
              required
              placeholder="Ex: Violão, Recepção, Som, Mídia..."
              className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Botão de Salvar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 inline-flex items-center justify-center gap-2 font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              "Confirmar e Escalar"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

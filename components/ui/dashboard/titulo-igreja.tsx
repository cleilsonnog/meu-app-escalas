"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { salvarIgrejaName } from "@/app/actions/configuracoes";

interface Props {
  nomeInicial: string;
}

export function TituloIgreja({ nomeInicial }: Props) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(nomeInicial);
  const [tempNome, setTempNome] = useState(nomeInicial);
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    setSalvando(true);
    await salvarIgrejaName(tempNome);
    setNome(tempNome);
    setSalvando(false);
    setEditando(false);
  };

  if (editando) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <input
          type="text"
          value={tempNome}
          onChange={(e) => setTempNome(e.target.value)}
          placeholder="Ex: Seu Ministério"
          className="px-2 py-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
        />
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => setEditando(false)}
          className="p-1 text-slate-400 hover:bg-slate-100 rounded-md"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Painel de Gestão{" "}
        {nome ? (
          <span className="text-indigo-600 dark:text-indigo-400">— {nome}</span>
        ) : (
          ""
        )}
      </h1>
      <button
        onClick={() => {
          setTempNome(nome);
          setEditando(true);
        }}
        title="Editar nome da igreja/ministério"
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}

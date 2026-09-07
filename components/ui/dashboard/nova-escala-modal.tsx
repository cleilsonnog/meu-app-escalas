"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { criarEscala } from "@/app/actions/escalas";

interface Voluntario {
  id: string;
  nome: string;
  departamento: string;
}

export function NovaEscalaModal({
  voluntarios,
}: {
  voluntarios: Voluntario[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await criarEscala(formData);
    setLoading(false);

    if (result.success) {
      setOpen(false);
    } else {
      alert(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl shadow-sm transition whitespace-nowrap">
        <PlusCircle className="h-4 w-4 shrink-0" />
        <span>Nova Escala</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Escalar Voluntário</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="tituloEvento">Evento / Culto</Label>
            <Input
              id="tituloEvento"
              name="tituloEvento"
              placeholder="Ex: Culto de Domingo"
              required
            />
          </div>

          <div>
            <Label htmlFor="dataHora">Data e Horário</Label>
            <Input
              id="dataHora"
              name="dataHora"
              type="datetime-local"
              required
            />
          </div>

          <div>
            <Label htmlFor="volunteerId">Voluntário</Label>
            <Select name="volunteerId" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a pessoa" />
              </SelectTrigger>
              <SelectContent>
                {voluntarios.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nome} ({v.departamento})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="funcaoEspecifica">Função Específica</Label>
            <Input
              id="funcaoEspecifica"
              name="funcaoEspecifica"
              placeholder="Ex: Baterista, Câmera 1, Recepção"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Escala"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

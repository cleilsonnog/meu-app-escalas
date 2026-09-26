import { describe, it, expect } from "vitest";
import {
  createVoluntarioSchema,
  updateVoluntarioSchema,
  criarEventoSchema,
  criarEscalaSchema,
  adicionarVoluntarioSchema,
  responderEscalaSchema,
  ministerioSchema,
  cadastrarLiderSchema,
  salvarIgrejaSchema,
  parseFormData,
} from "@/lib/validations";

describe("createVoluntarioSchema", () => {
  it("aceita dados validos", () => {
    const result = createVoluntarioSchema.safeParse({
      nome: "João Silva",
      telefone: "11999998888",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.departamento).toBe("Geral");
    }
  });

  it("rejeita nome vazio", () => {
    const result = createVoluntarioSchema.safeParse({
      nome: "",
      telefone: "11999998888",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita telefone curto", () => {
    const result = createVoluntarioSchema.safeParse({
      nome: "João",
      telefone: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita nome maior que 120 chars", () => {
    const result = createVoluntarioSchema.safeParse({
      nome: "A".repeat(121),
      telefone: "11999998888",
    });
    expect(result.success).toBe(false);
  });

  it("faz trim no nome", () => {
    const result = createVoluntarioSchema.safeParse({
      nome: "  João  ",
      telefone: "11999998888",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nome).toBe("João");
    }
  });

  it("aceita email valido e faz lowercase", () => {
    const result = createVoluntarioSchema.safeParse({
      nome: "João",
      telefone: "11999998888",
      email: "JOAO@EMAIL.COM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("joao@email.com");
    }
  });

  it("aceita email vazio", () => {
    const result = createVoluntarioSchema.safeParse({
      nome: "João",
      telefone: "11999998888",
      email: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("responderEscalaSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("aceita CONFIRMADO", () => {
    const result = responderEscalaSchema.safeParse({
      id: validUuid,
      novoStatus: "CONFIRMADO",
    });
    expect(result.success).toBe(true);
  });

  it("aceita RECUSADO com observacao", () => {
    const result = responderEscalaSchema.safeParse({
      id: validUuid,
      novoStatus: "RECUSADO",
      observacao: "Tenho compromisso",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita status invalido", () => {
    const result = responderEscalaSchema.safeParse({
      id: validUuid,
      novoStatus: "INVALIDO",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita id invalido", () => {
    const result = responderEscalaSchema.safeParse({
      id: "nao-e-uuid",
      novoStatus: "CONFIRMADO",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita observacao maior que 500 chars", () => {
    const result = responderEscalaSchema.safeParse({
      id: validUuid,
      novoStatus: "RECUSADO",
      observacao: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("ministerioSchema", () => {
  it("aceita nome valido", () => {
    const result = ministerioSchema.safeParse({ nome: "Louvor" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.descricao).toBeNull();
    }
  });

  it("transforma descricao vazia em null", () => {
    const result = ministerioSchema.safeParse({
      nome: "Louvor",
      descricao: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.descricao).toBeNull();
    }
  });
});

describe("cadastrarLiderSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("aceita dados completos", () => {
    const result = cadastrarLiderSchema.safeParse({
      nome: "Maria",
      email: "maria@igreja.com",
      telefone: "11999997777",
      ministryId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita email invalido", () => {
    const result = cadastrarLiderSchema.safeParse({
      nome: "Maria",
      email: "nao-e-email",
      telefone: "11999997777",
      ministryId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it("faz lowercase no email", () => {
    const result = cadastrarLiderSchema.safeParse({
      nome: "Maria",
      email: "MARIA@IGREJA.COM",
      telefone: "11999997777",
      ministryId: validUuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("maria@igreja.com");
    }
  });
});

describe("parseFormData", () => {
  it("extrai e valida FormData corretamente", () => {
    const fd = new FormData();
    fd.set("nome", " João ");
    fd.set("telefone", "11999998888");

    const result = parseFormData(createVoluntarioSchema, fd);
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.nome).toBe("João");
    }
  });

  it("retorna erro com FormData invalido", () => {
    const fd = new FormData();
    fd.set("nome", "");
    fd.set("telefone", "");

    const result = parseFormData(createVoluntarioSchema, fd);
    expect("error" in result).toBe(true);
  });
});

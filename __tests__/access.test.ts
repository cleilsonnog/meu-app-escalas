import { describe, it, expect } from "vitest";
import {
  ownerWhere,
  volunteerWhere,
  eventWhere,
  scheduleMinistryFilter,
  scheduleMinistryId,
  type AccessContext,
} from "@/lib/access";

const adminContext: AccessContext = {
  clerkUserId: "user_admin_123",
  ownerClerkUserId: "user_admin_123",
  role: "ADMIN",
};

const leaderContext: AccessContext = {
  clerkUserId: "user_leader_456",
  ownerClerkUserId: "user_admin_123",
  role: "LEADER",
  volunteerId: "vol_789",
  ministryId: "min_abc",
  ministryName: "Louvor",
};

describe("ownerWhere", () => {
  it("retorna clerkUserId do owner para admin", () => {
    expect(ownerWhere(adminContext)).toEqual({
      clerkUserId: "user_admin_123",
    });
  });

  it("retorna clerkUserId do owner para leader", () => {
    expect(ownerWhere(leaderContext)).toEqual({
      clerkUserId: "user_admin_123",
    });
  });
});

describe("volunteerWhere", () => {
  it("admin: filtra apenas por clerkUserId", () => {
    const where = volunteerWhere(adminContext);
    expect(where).toEqual({ clerkUserId: "user_admin_123" });
    expect(where).not.toHaveProperty("ministries");
  });

  it("leader: filtra por clerkUserId + ministerio", () => {
    const where = volunteerWhere(leaderContext);
    expect(where.clerkUserId).toBe("user_admin_123");
    expect(where.ministries).toEqual({ some: { id: "min_abc" } });
  });
});

describe("eventWhere", () => {
  it("admin: filtra apenas por clerkUserId", () => {
    const where = eventWhere(adminContext);
    expect(where).toEqual({ clerkUserId: "user_admin_123" });
    expect(where).not.toHaveProperty("escalas");
  });

  it("leader: filtra por clerkUserId + escalas do ministerio", () => {
    const where = eventWhere(leaderContext);
    expect(where.clerkUserId).toBe("user_admin_123");
    expect(where.escalas).toEqual({ some: { ministryId: "min_abc" } });
  });
});

describe("scheduleMinistryFilter", () => {
  it("admin: retorna filtro vazio", () => {
    expect(scheduleMinistryFilter(adminContext)).toEqual({});
  });

  it("leader: filtra por ministryId", () => {
    expect(scheduleMinistryFilter(leaderContext)).toEqual({
      ministryId: "min_abc",
    });
  });
});

describe("scheduleMinistryId", () => {
  it("admin: retorna fallback ou null", () => {
    expect(scheduleMinistryId(adminContext)).toBeNull();
    expect(scheduleMinistryId(adminContext, "fallback_id")).toBe("fallback_id");
  });

  it("leader: sempre retorna ministryId do contexto", () => {
    expect(scheduleMinistryId(leaderContext)).toBe("min_abc");
    expect(scheduleMinistryId(leaderContext, "ignored")).toBe("min_abc");
  });
});

/**
 * Permission Enforcement Tests
 *
 * Verifies that the RBAC permission model correctly allows and denies
 * actions based on user roles. These are unit tests of the roles.ts module.
 */

import { describe, it, expect } from "@jest/globals";
import {
  hasPermission,
  assertPermission,
  getUserPermissions,
  PermissionError,
} from "../lib/auth/roles";
import type { UserRole, Permission } from "../lib/auth/roles";

// =============================================================================
// ROLE: super_admin
// =============================================================================

describe("super_admin permissions", () => {
  const role: UserRole = "super_admin";

  it("can read any company", () => {
    expect(hasPermission(role, "company:read")).toBe(true);
  });

  it("can write to companies", () => {
    expect(hasPermission(role, "company:write")).toBe(true);
  });

  it("can admin companies", () => {
    expect(hasPermission(role, "company:admin")).toBe(true);
  });

  it("can manage users", () => {
    expect(hasPermission(role, "user:manage")).toBe(true);
  });

  it("can read audit logs", () => {
    expect(hasPermission(role, "audit_log:read")).toBe(true);
  });

  it("can read cross-company aggregated data", () => {
    expect(hasPermission(role, "cross_company:read")).toBe(true);
  });

  it("can delete artifacts", () => {
    expect(hasPermission(role, "artifact:delete")).toBe(true);
  });
});

// =============================================================================
// ROLE: operating_partner
// =============================================================================

describe("operating_partner permissions", () => {
  const role: UserRole = "operating_partner";

  it("can read and write artifacts", () => {
    expect(hasPermission(role, "artifact:read")).toBe(true);
    expect(hasPermission(role, "artifact:write")).toBe(true);
  });

  it("cannot delete artifacts", () => {
    expect(hasPermission(role, "artifact:delete")).toBe(false);
  });

  it("cannot manage users", () => {
    expect(hasPermission(role, "user:manage")).toBe(false);
  });

  it("cannot read cross-company data", () => {
    expect(hasPermission(role, "cross_company:read")).toBe(false);
  });

  it("can upload documents", () => {
    expect(hasPermission(role, "document:upload")).toBe(true);
  });

  it("cannot delete documents", () => {
    expect(hasPermission(role, "document:delete")).toBe(false);
  });
});

// =============================================================================
// ROLE: ceo
// =============================================================================

describe("ceo permissions", () => {
  const role: UserRole = "ceo";

  it("can write conversations and artifacts", () => {
    expect(hasPermission(role, "conversation:write")).toBe(true);
    expect(hasPermission(role, "artifact:write")).toBe(true);
  });

  it("cannot delete artifacts", () => {
    expect(hasPermission(role, "artifact:delete")).toBe(false);
  });

  it("cannot manage users", () => {
    expect(hasPermission(role, "user:manage")).toBe(false);
  });

  it("cannot read audit logs", () => {
    expect(hasPermission(role, "audit_log:read")).toBe(false);
  });

  it("cannot read cross-company data", () => {
    expect(hasPermission(role, "cross_company:read")).toBe(false);
  });
});

// =============================================================================
// ROLE: domain_specialist
// =============================================================================

describe("domain_specialist permissions", () => {
  const role: UserRole = "domain_specialist";

  it("can read and write artifacts", () => {
    expect(hasPermission(role, "artifact:read")).toBe(true);
    expect(hasPermission(role, "artifact:write")).toBe(true);
  });

  it("cannot admin companies", () => {
    expect(hasPermission(role, "company:admin")).toBe(false);
  });

  it("cannot manage users", () => {
    expect(hasPermission(role, "user:manage")).toBe(false);
  });

  it("cannot write risks (read only)", () => {
    // Specialists can read risks but not write them
    expect(hasPermission(role, "risk:read")).toBe(true);
    expect(hasPermission(role, "risk:write")).toBe(false);
  });

  it("cannot delete documents", () => {
    expect(hasPermission(role, "document:delete")).toBe(false);
  });
});

// =============================================================================
// ROLE: board_member
// =============================================================================

describe("board_member permissions — read-only", () => {
  const role: UserRole = "board_member";

  const readPermissions: Permission[] = [
    "company:read",
    "artifact:read",
    "action_item:read",
    "document:read",
    "risk:read",
  ];

  const deniedPermissions: Permission[] = [
    "company:write",
    "company:admin",
    "conversation:write",
    "artifact:write",
    "artifact:delete",
    "action_item:write",
    "document:upload",
    "document:delete",
    "risk:write",
    "user:manage",
    "audit_log:read",
    "cross_company:read",
  ];

  for (const perm of readPermissions) {
    it(`can ${perm}`, () => {
      expect(hasPermission(role, perm)).toBe(true);
    });
  }

  for (const perm of deniedPermissions) {
    it(`cannot ${perm}`, () => {
      expect(hasPermission(role, perm)).toBe(false);
    });
  }

  it("board_member cannot create conversations", () => {
    expect(hasPermission(role, "conversation:write")).toBe(false);
  });
});

// =============================================================================
// assertPermission — throws on denial
// =============================================================================

describe("assertPermission", () => {
  it("does not throw when permission is granted", () => {
    expect(() => assertPermission("ceo", "artifact:write")).not.toThrow();
  });

  it("throws PermissionError when permission is denied", () => {
    expect(() => assertPermission("board_member", "artifact:write")).toThrow(
      PermissionError
    );
  });

  it("PermissionError has correct status code", () => {
    try {
      assertPermission("board_member", "company:admin");
      expect(true).toBe(false); // should not reach here
    } catch (err) {
      expect(err).toBeInstanceOf(PermissionError);
      expect((err as PermissionError).statusCode).toBe(403);
    }
  });
});

// =============================================================================
// getUserPermissions
// =============================================================================

describe("getUserPermissions", () => {
  it("returns all permissions for super_admin", () => {
    const perms = getUserPermissions("super_admin");
    expect(perms.length).toBeGreaterThan(10);
    expect(perms).toContain("cross_company:read");
    expect(perms).toContain("user:manage");
  });

  it("returns limited permissions for board_member", () => {
    const perms = getUserPermissions("board_member");
    expect(perms.length).toBeLessThan(8);
    expect(perms).not.toContain("artifact:write");
  });

  it("super_admin has more permissions than any other role", () => {
    const adminCount = getUserPermissions("super_admin").length;
    const roles: UserRole[] = ["operating_partner", "ceo", "domain_specialist", "board_member"];

    for (const role of roles) {
      expect(adminCount).toBeGreaterThan(getUserPermissions(role).length);
    }
  });
});

// =============================================================================
// PRIVILEGE ESCALATION PREVENTION
// =============================================================================

describe("Privilege escalation prevention", () => {
  it("board_member cannot escalate to write by combining grants", () => {
    // Even if a board_member somehow gets two permission checks,
    // neither individually grants write
    const perms = getUserPermissions("board_member");
    const writePerm = perms.filter((p) => p.includes(":write"));
    expect(writePerm).toHaveLength(0);
  });

  it("ceo role does not include cross-company or admin", () => {
    expect(hasPermission("ceo", "cross_company:read")).toBe(false);
    expect(hasPermission("ceo", "company:admin")).toBe(false);
    expect(hasPermission("ceo", "user:manage")).toBe(false);
  });

  it("domain_specialist cannot manage users or access audit logs", () => {
    expect(hasPermission("domain_specialist", "user:manage")).toBe(false);
    expect(hasPermission("domain_specialist", "audit_log:read")).toBe(false);
  });
});

// =============================================================================
// UNKNOWN ROLE SAFETY
// =============================================================================

describe("Unknown role safety", () => {
  it("unknown role returns no permissions (fail-closed)", () => {
    const perms = getUserPermissions("unknown_role" as UserRole);
    expect(perms).toEqual([]);
  });

  it("hasPermission returns false for unknown role", () => {
    expect(hasPermission("unknown_role" as UserRole, "artifact:read")).toBe(false);
  });
});

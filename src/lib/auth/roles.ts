import type { UserRole } from "@/types";

// =============================================================================
// E3 Permission Model — Role-Based Access Control
// =============================================================================

export type Permission =
  | "company:read"
  | "company:write"
  | "company:admin"
  | "conversation:read"
  | "conversation:write"
  | "artifact:read"
  | "artifact:write"
  | "artifact:delete"
  | "action_item:read"
  | "action_item:write"
  | "document:read"
  | "document:upload"
  | "document:delete"
  | "risk:read"
  | "risk:write"
  | "user:manage"
  | "audit_log:read"
  | "cross_company:read"; // aggregated, anonymized cross-company insights

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "company:read",
    "company:write",
    "company:admin",
    "conversation:read",
    "conversation:write",
    "artifact:read",
    "artifact:write",
    "artifact:delete",
    "action_item:read",
    "action_item:write",
    "document:read",
    "document:upload",
    "document:delete",
    "risk:read",
    "risk:write",
    "user:manage",
    "audit_log:read",
    "cross_company:read",
  ],
  operating_partner: [
    "company:read",
    "company:write",
    "conversation:read",
    "conversation:write",
    "artifact:read",
    "artifact:write",
    "action_item:read",
    "action_item:write",
    "document:read",
    "document:upload",
    "risk:read",
    "risk:write",
  ],
  ceo: [
    "company:read",
    "company:write",
    "conversation:read",
    "conversation:write",
    "artifact:read",
    "artifact:write",
    "action_item:read",
    "action_item:write",
    "document:read",
    "document:upload",
    "risk:read",
    "risk:write",
  ],
  domain_specialist: [
    "company:read",
    "conversation:read",
    "conversation:write",
    "artifact:read",
    "artifact:write",
    "action_item:read",
    "action_item:write",
    "document:read",
    "document:upload",
    "risk:read",
  ],
  board_member: [
    "company:read",
    "artifact:read",
    "action_item:read",
    "document:read",
    "risk:read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new PermissionError(
      `Role '${role}' does not have permission '${permission}'`
    );
  }
}

export function getUserPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// Roles that can write (not read-only)
export const WRITE_ROLES: UserRole[] = [
  "super_admin",
  "operating_partner",
  "ceo",
  "domain_specialist",
];

// Roles that can manage other users
export const ADMIN_ROLES: UserRole[] = ["super_admin"];

export class PermissionError extends Error {
  readonly statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

// =============================================================================
// API Response Helpers
// =============================================================================

export function unauthorizedResponse(message = "Not authenticated") {
  return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Access denied") {
  return Response.json({ error: message }, { status: 403 });
}

export function notFoundResponse(message = "Not found") {
  return Response.json({ error: message }, { status: 404 });
}

export function badRequestResponse(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function internalErrorResponse(message = "Internal server error") {
  return Response.json({ error: message }, { status: 500 });
}

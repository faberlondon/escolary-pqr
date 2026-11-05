import type { Radicado } from "./types";

export type UserRole = "coordinador" | "rector" | "responsable" | "docente" | "admin";

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  /** Área que atiende el responsable. */
  area?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  coordinador: "Coordinador",
  rector: "Rectora",
  responsable: "Responsable de área",
  docente: "Docente",
  admin: "Administrador IE",
};

/** Usuarios de ejemplo para recorrer la demo con cada rol (RN-07). */
export const DEMO_USERS: DemoUser[] = [
  { id: "coord", name: "Inocencio Coronado", role: "coordinador", area: "Coordinación académica" },
  { id: "rector", name: "Rosa Gil", role: "rector", area: "Rectoría" },
  { id: "convivencia", name: "Rafael Pushaina", role: "responsable", area: "Coordinación de convivencia" },
  { id: "docente", name: "Luis Pérez", role: "docente" },
  { id: "admin", name: "Marta Villa", role: "admin", area: "Secretaría" },
];

export const DEFAULT_USER = DEMO_USERS[0];

/** RN-07: el docente ve lo suyo, el responsable lo asignado, coordinación y rectoría todo. */
export function canSee(user: DemoUser, r: Radicado): boolean {
  switch (user.role) {
    case "coordinador":
    case "rector":
      return true;
    case "responsable":
      return r.assignee === user.name || r.assignedArea === user.area;
    case "docente":
      return r.requester.role === "docente" && r.requester.name === user.name;
    case "admin":
      return false;
  }
}

/** RN-11: datos de estudiantes menores solo para roles con necesidad (o quien los radicó). */
export function canSeeMinorData(user: DemoUser, r: Radicado): boolean {
  if (user.role === "coordinador" || user.role === "rector") return true;
  if (user.role === "responsable") return r.assignee === user.name || r.assignedArea === user.area;
  return user.role === "docente" && r.requester.name === user.name;
}

export interface Permissions {
  assign: boolean;
  note: boolean;
  respond: boolean;
  extend: boolean;
  requestInfo: boolean;
  transfer: boolean;
  annul: boolean;
  close: boolean;
  reviewDocs: boolean;
}

export function permissionsFor(user: DemoUser, r: Radicado): Permissions {
  const coord = user.role === "coordinador";
  const handler = coord || (user.role === "responsable" && canSee(user, r));
  return {
    assign: coord,
    note: handler || user.role === "rector",
    respond: handler || user.role === "rector",
    extend: handler,
    requestInfo: handler,
    transfer: coord,
    annul: coord,
    close: coord,
    reviewDocs: handler,
  };
}

export const canManageConfig = (u: DemoUser): boolean => u.role === "coordinador" || u.role === "admin";
export const canSeeReports = (u: DemoUser): boolean => u.role === "coordinador" || u.role === "rector";
export const canSeeAudit = (u: DemoUser): boolean => u.role !== "docente" && u.role !== "responsable";
export const canManageSurveys = (u: DemoUser): boolean => u.role === "coordinador" || u.role === "rector";

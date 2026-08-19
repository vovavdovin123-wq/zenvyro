import { randomBytes } from "node:crypto";

export function createId(): string {
  return randomBytes(4).toString("hex");
}

export function nowIso(): string {
  return new Date().toISOString();
}

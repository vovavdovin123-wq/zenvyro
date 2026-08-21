import { createHmac, timingSafeEqual } from "node:crypto";
import { studioAuth } from "./config";

const COOKIE = "zenvyro_studio";

export const studioCookie = {
  name: COOKIE,
  path: "/",
} as const;

export function studioSessionToken(password = studioAuth.password) {
  if (!password) return "";
  return createHmac("sha256", password).update("zenvyro.studio.v1").digest("hex");
}

export function isStudioSession(value?: string | null) {
  const expected = studioSessionToken();
  if (!expected || !value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

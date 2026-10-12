import { randomBytes } from "node:crypto";

// URL-safe random token of given byte length
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

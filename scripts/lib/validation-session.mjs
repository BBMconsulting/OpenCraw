import { randomBytes } from "node:crypto";

const LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;
const NONCE_PATTERN = /^[a-f0-9]{16,64}$/;
const VALIDATION_KEY_PATTERN =
  /^agent:([a-z0-9][a-z0-9-]*):validation:([a-z0-9][a-z0-9-]*):([a-z0-9][a-z0-9-]*):(\d{8}T\d{9}Z):([a-f0-9]{16,64})$/;

function normalizeLabel(value, field) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!LABEL_PATTERN.test(normalized)) {
    throw new Error(`${field} must resolve to 1-48 lowercase letters, numbers, or hyphens`);
  }
  return normalized;
}

function formatUtcTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("now must be a valid date");
  }
  return date.toISOString().replace(/[-:.]/g, "");
}

export function assertIsolatedValidationSessionKey(sessionKey) {
  const match = VALIDATION_KEY_PATTERN.exec(String(sessionKey ?? "").trim());
  if (!match) {
    throw new Error(
      "validation session key must use agent:<agent>:validation:<service>:<purpose>:<UTC>:<nonce>",
    );
  }
  return {
    agentId: match[1],
    service: match[2],
    purpose: match[3],
    timestamp: match[4],
    nonce: match[5],
  };
}

export function createIsolatedValidationSession(options) {
  const agentId = normalizeLabel(options.agentId ?? "main", "agentId");
  const service = normalizeLabel(options.service, "service");
  const purpose = normalizeLabel(options.purpose, "purpose");
  const timestamp = formatUtcTimestamp(options.now ?? new Date());
  const nonce = String(options.nonce ?? randomBytes(12).toString("hex")).toLowerCase();
  if (!NONCE_PATTERN.test(nonce)) {
    throw new Error("nonce must contain 16-64 lowercase hexadecimal characters");
  }
  const sessionKey = `agent:${agentId}:validation:${service}:${purpose}:${timestamp}:${nonce}`;
  assertIsolatedValidationSessionKey(sessionKey);
  return {
    agentId,
    agentArgs: ["--agent", agentId, "--session-key", sessionKey],
    purpose,
    service,
    sessionKey,
    ...(options.baseUrl
      ? { controlUiUrl: createControlUiValidationUrl(options.baseUrl, sessionKey) }
      : {}),
  };
}

export function createControlUiValidationUrl(baseUrl, sessionKey) {
  assertIsolatedValidationSessionKey(sessionKey);
  const url = new URL(baseUrl);
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("baseUrl must not contain credentials, query parameters, or a fragment");
  }
  const pathname = url.pathname.replace(/\/+$/, "");
  url.pathname = pathname.endsWith("/chat") ? pathname : `${pathname}/chat`.replace(/^\/\//, "/");
  url.searchParams.set("session", sessionKey);
  return url.toString();
}

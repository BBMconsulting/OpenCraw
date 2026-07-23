export type IsolatedValidationSessionOptions = {
  agentId?: string;
  baseUrl?: string;
  nonce?: string;
  now?: Date | string | number;
  purpose: string;
  service: string;
};

export type IsolatedValidationSession = {
  agentArgs: ["--agent", string, "--session-key", string];
  agentId: string;
  controlUiUrl?: string;
  purpose: string;
  service: string;
  sessionKey: string;
};

export function assertIsolatedValidationSessionKey(sessionKey: string): {
  agentId: string;
  nonce: string;
  purpose: string;
  service: string;
  timestamp: string;
};

export function createControlUiValidationUrl(baseUrl: string, sessionKey: string): string;

export function createIsolatedValidationSession(
  options: IsolatedValidationSessionOptions,
): IsolatedValidationSession;

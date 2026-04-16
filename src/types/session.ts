export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "live"
  | "reconnecting"
  | "error";

export interface TryOnSession {
  status: ConnectionStatus;
  elapsedSeconds: number;
  error: string | null;
}

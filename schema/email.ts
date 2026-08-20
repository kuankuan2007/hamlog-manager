export const callsign2EmailModes = ['auto', 'cache', 'fallback', 'realtime'] as const;
export type Callsign2EmailMode = typeof callsign2EmailModes[number];
export interface Callsign2EmailResponse {
  callsign: string;
  email: string | null;
  comeFrom?: string;
  realtime: boolean;
  lastUpdate?: string;
  mode: Callsign2EmailMode;
}

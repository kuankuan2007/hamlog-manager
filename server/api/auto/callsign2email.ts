import Router from "@kuankuan/k-server";
import { invalidInputStatue } from "@server/api/status";
import { callsign2email } from "@server/auto/callsign2email";
import {
  insertCallsignEmailCache,
  selectLatestCallsignEmailCache,
} from "@server/database/callsign-email-cache";
import { normalizeCallsign } from "@server/database";

const callsign2EmailModes = ['auto', 'cache', 'fallback', 'realtime'] as const;
type Callsign2EmailMode = typeof callsign2EmailModes[number];

interface Callsign2EmailResponse {
  callsign: string;
  email: string | null;
  comeFrom?: string;
  realtime: boolean;
  lastUpdate?: string;
  mode: Callsign2EmailMode;
}

function isCallsign2EmailMode(value: string | null): value is Callsign2EmailMode {
  return value !== null && callsign2EmailModes.includes(value as Callsign2EmailMode);
}

function formatCurrentDateTime(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function toCachedResponse(
  mode: Callsign2EmailMode,
  cache: { callsign: string; email: string; provider: string; updatedAt: string }
): Callsign2EmailResponse {
  return {
    callsign: cache.callsign,
    email: cache.email,
    comeFrom: cache.provider,
    realtime: false,
    lastUpdate: cache.updatedAt,
    mode,
  };
}

export const Callsign2EmailRouter = new Router({
  matcher: 'callsign2email',
  name: 'callsign2email',
  onRootMatch: async (req, _res, ctx) => {
    const callsign = req.ourl.searchParams.get('callsign');
    if (!callsign) {
      ctx.statue = invalidInputStatue('callsign is required');
      return;
    }
    const modeParameter = req.ourl.searchParams.get('mode');
    const mode = modeParameter ?? 'auto';
    if (!isCallsign2EmailMode(mode)) {
      ctx.statue = invalidInputStatue('mode must be one of: auto, cache, fallback, realtime');
      return;
    }

    const normalizedCallsign = normalizeCallsign(callsign);
    if (mode === 'auto' || mode === 'cache') {
      const cache = await selectLatestCallsignEmailCache(normalizedCallsign);
      if (cache !== null) {
        ctx.data = toCachedResponse(mode, cache);
        return;
      }
      if (mode === 'cache') {
        ctx.data = { callsign: normalizedCallsign, email: null, realtime: false, mode };
        return;
      }
    }

    const email = await callsign2email(normalizedCallsign);
    if (email !== null) {
      const cache = await insertCallsignEmailCache({
        callsign: normalizedCallsign,
        email,
        updatedAt: formatCurrentDateTime(),
        provider: 'select:qrz.com',
      });
      ctx.data = {
        callsign: cache.callsign,
        email: cache.email,
        comeFrom: cache.provider,
        realtime: true,
        lastUpdate: cache.updatedAt,
        mode,
      };
      return;
    }

    if (mode === 'fallback') {
      const cache = await selectLatestCallsignEmailCache(normalizedCallsign);
      if (cache !== null) {
        ctx.data = toCachedResponse(mode, cache);
        return;
      }
    }
    ctx.data = { callsign: normalizedCallsign, email: null, realtime: true, mode };
  }
});

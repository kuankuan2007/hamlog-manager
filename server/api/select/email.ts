import Router from '@kuankuan/k-server';
import { invalidInputStatue } from '@server/api/status';
import { selectConfiguredCallsignByEmail } from '@server/config/self-info';
import { selectLatestCallsignByEmail } from '@server/database/callsign-email-cache';
import type { Email2CallsignResponse } from '@server/schema';

export const SelectCallsignByEmailRouter = new Router({
  matcher: (pathname) => pathname === '/email2callsign',
  name: 'email2callsign',
  onRootMatch: async (request, _response, ctx) => {
    const email = request.ourl.searchParams.get('email')?.trim();
    if (!email) {
      ctx.statue = invalidInputStatue('email is required');
      return;
    }

    const configuredCallsign = selectConfiguredCallsignByEmail(email);
    if (configuredCallsign !== null) {
      const configuredResponse: Email2CallsignResponse = {
        email,
        callsign: configuredCallsign,
        comeFrom: 'config',
        realtime: true,
      };
      ctx.data = configuredResponse;
      return;
    }

    const cache = await selectLatestCallsignByEmail(email);
    const response: Email2CallsignResponse = cache === null
      ? { email, callsign: null }
      : {
          email: cache.email,
          callsign: cache.callsign,
          comeFrom: cache.provider,
          lastUpdate: cache.updatedAt,
        };
    ctx.data = response;
  },
});
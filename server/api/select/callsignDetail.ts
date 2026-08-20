import Router from '@kuankuan/k-server';
import { invalidInputStatue } from '@server/api/status';
import { selectCallsignDetail } from '@server/database/select';

export const SelectCallsignDetailRouter = new Router({
  matcher: (pathname) => pathname === '/callsign-detail',
  name: 'callsign-detail',
  onRootMatch: async (request, _response, ctx) => {
    const callsign = request.ourl.searchParams.get('callsign')?.trim();
    if (!callsign) {
      ctx.statue = invalidInputStatue('callsign is required');
      return;
    }

    ctx.data = await selectCallsignDetail(callsign);
  },
});

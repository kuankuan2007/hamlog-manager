import Router from '@kuankuan/k-server';
import { selectQSLSends, selectQSLSendsByCallsign } from '@server/database/select';

function getCallsign(pathname: string): string {
  const callsign = pathname.match(/^\/api\/select\/qsl-send\/([^/]+)$/)?.[1];
  return decodeURIComponent(callsign ?? '');
}

export const SelectQSLSendsRouter = new Router({
  matcher: (pathname) => pathname === '/qsl-send',
  name: 'qsl-send',
  onRootMatch: async (_request, _response, ctx) => {
    ctx.data = await selectQSLSends();
  },
});

export const SelectQSLSendsByCallsignRouter = new Router({
  matcher: (pathname) => /^\/qsl-send\/[^/]+$/.test(pathname),
  name: 'qsl-send-by-callsign',
  onRootMatch: async (request, _response, ctx) => {
    ctx.data = await selectQSLSendsByCallsign(getCallsign(request.ourl.pathname));
  },
});

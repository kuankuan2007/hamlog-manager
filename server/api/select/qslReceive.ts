import Router from '@kuankuan/k-server';
import { selectQSLReceives, selectQSLReceivesByCallsign } from '@server/database/select';

function getCallsign(pathname: string): string {
  const callsign = pathname.match(/^\/api\/select\/qsl-receive\/([^/]+)$/)?.[1];
  return decodeURIComponent(callsign ?? '');
}

export const SelectQSLReceivesRouter = new Router({
  matcher: (pathname) => pathname === '/qsl-receive',
  name: 'qsl-receive',
  onRootMatch: async (_request, _response, ctx) => {
    ctx.data = await selectQSLReceives();
  },
});

export const SelectQSLReceivesByCallsignRouter = new Router({
  matcher: (pathname) => /^\/qsl-receive\/[^/]+$/.test(pathname),
  name: 'qsl-receive-by-callsign',
  onRootMatch: async (request, _response, ctx) => {
    ctx.data = await selectQSLReceivesByCallsign(getCallsign(request.ourl.pathname));
  },
});

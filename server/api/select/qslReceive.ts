import Router from '@kuankuan/k-server';
import {
  selectQSLReceiveById,
  selectQSLReceives,
  selectQSLReceivesByCallsign,
  selectQSLReceivesByCallsigns,
} from '@server/database/select';

function getCallsign(pathname: string): string {
  const callsign = pathname.match(/^\/api\/select\/qsl-receive\/([^/]+)$/)?.[1];
  return decodeURIComponent(callsign ?? '');
}

function getId(pathname: string): number {
  return Number(pathname.match(/^\/api\/select\/qsl-receive\/id\/(\d+)$/)?.[1]);
}

export const SelectQSLReceivesRouter = new Router({
  matcher: (pathname) => pathname === '/qsl-receive',
  name: 'qsl-receive',
  onRootMatch: async (_request, _response, ctx) => {
    ctx.data = await selectQSLReceives();
  },
});

export const SelectQSLReceivesByCallsignsRouter = new Router({
  matcher: (pathname) => pathname === '/qsl-receive-query',
  name: 'qsl-receive-query',
  onRootMatch: async (request, _response, ctx) => {
    const callsigns = request.ourl.searchParams.get('callsign')?.split(',') ?? [];
    ctx.data = await selectQSLReceivesByCallsigns(callsigns);
  },
});

export const SelectQSLReceiveByIdRouter = new Router({
  matcher: (pathname) => /^\/qsl-receive\/id\/\d+$/.test(pathname),
  name: 'qsl-receive-by-id',
  onRootMatch: async (request, _response, ctx) => {
    ctx.data = await selectQSLReceiveById(getId(request.ourl.pathname));
  },
});

export const SelectQSLReceivesByCallsignRouter = new Router({
  matcher: (pathname) => /^\/qsl-receive\/[^/]+$/.test(pathname),
  name: 'qsl-receive-by-callsign',
  onRootMatch: async (request, _response, ctx) => {
    ctx.data = await selectQSLReceivesByCallsign(getCallsign(request.ourl.pathname));
  },
});

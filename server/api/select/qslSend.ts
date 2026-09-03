import Router from '@kuankuan/k-server';
import {
  selectQSLSendById,
  selectQSLSends,
  selectQSLSendsByCallsign,
  selectQSLSendsByCallsigns,
} from '@server/database/select';

function getCallsign(pathname: string): string {
  const callsign = pathname.match(/^\/api\/select\/qsl-send\/([^/]+)$/)?.[1];
  return decodeURIComponent(callsign ?? '');
}

function getId(pathname: string): number {
  return Number(pathname.match(/^\/api\/select\/qsl-send\/id\/(\d+)$/)?.[1]);
}

export const SelectQSLSendsRouter = new Router({
  matcher: (pathname) => pathname === '/qsl-send',
  name: 'qsl-send',
  onRootMatch: async (_request, _response, ctx) => {
    ctx.data = await selectQSLSends();
  },
});

export const SelectQSLSendsByCallsignsRouter = new Router({
  matcher: (pathname) => pathname === '/qsl-send-query',
  name: 'qsl-send-query',
  onRootMatch: async (request, _response, ctx) => {
    const callsigns = request.ourl.searchParams.get('callsign')?.split(',') ?? [];
    ctx.data = await selectQSLSendsByCallsigns(callsigns);
  },
});

export const SelectQSLSendByIdRouter = new Router({
  matcher: (pathname) => /^\/qsl-send\/id\/\d+$/.test(pathname),
  name: 'qsl-send-by-id',
  onRootMatch: async (request, _response, ctx) => {
    ctx.data = await selectQSLSendById(getId(request.ourl.pathname));
  },
});

export const SelectQSLSendsByCallsignRouter = new Router({
  matcher: (pathname) => /^\/qsl-send\/[^/]+$/.test(pathname),
  name: 'qsl-send-by-callsign',
  onRootMatch: async (request, _response, ctx) => {
    ctx.data = await selectQSLSendsByCallsign(getCallsign(request.ourl.pathname));
  },
});

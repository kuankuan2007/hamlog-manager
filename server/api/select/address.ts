import Router from '@kuankuan/k-server';
import { selectAddressByCallsign, selectAddresses } from '@server/database/select';

function getCallsign(pathname: string): string {
  const callsign = pathname.match(/^\/api\/select\/address\/([^/]+)$/)?.[1];
  return decodeURIComponent(callsign ?? '');
}

export const SelectAddressesRouter = new Router({
  matcher: (pathname) => pathname === '/address',
  name: 'address',
  onRootMatch: async (request, _response, ctx) => {
    const page = request.ourl.searchParams.get('page') ?? 0;
    const pageSize = request.ourl.searchParams.get('pageSize') ?? 100;
    ctx.data = await selectAddresses(Number(page), Number(pageSize));
  },
});

export const SelectAddressByCallsignRouter = new Router({
  matcher: (pathname) => /^\/address\/[^/]+$/.test(pathname),
  name: 'address-by-callsign',
  onRootMatch: async (request, _response, ctx) => {
    ctx.data = await selectAddressByCallsign(getCallsign(request.ourl.pathname));
  },
});

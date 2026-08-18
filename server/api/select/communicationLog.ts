import Router from '@kuankuan/k-server';
import {
	type CommunicationLogFilters,
  searchCommunicationLogBasics,
  selectCommunicationLogBasicsByCallsign,
  selectCommunicationLogs,
  selectCommunicationLogsByCallsign,
} from '@server/database/select';

function getCallsign(pathname: string, suffix = ''): string {
  const callsign = pathname.match(
    new RegExp(`^/api/select/communication-log/([^/]+)${suffix}$`)
  )?.[1];
  return decodeURIComponent(callsign ?? '');
}

function getBooleanFilter(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
}

function getCommunicationLogFilters(searchParams: URLSearchParams): CommunicationLogFilters {
  return {
    qslSent: getBooleanFilter(searchParams.get('qslSent')),
    qslReceived: getBooleanFilter(searchParams.get('qslReceived')),
    hasAddress: getBooleanFilter(searchParams.get('hasAddress')),
    deduplicateCallsigns: getBooleanFilter(
      searchParams.get('deduplicateCallsigns')
    ),
  };
}

export const SelectCommunicationLogsRouter = new Router({
  matcher: (pathname) => pathname === '/communication-log',
  name: 'communication-log',
  onRootMatch: async (request, _response, ctx) => {
    const page = request.ourl.searchParams.get('page') ?? 0;
    const pageSize = request.ourl.searchParams.get('pageSize') ?? 100;
    const result = await selectCommunicationLogs(
      Number(page),
      Number(pageSize),
      getCommunicationLogFilters(request.ourl.searchParams)
    );
    ctx.data = result;
  },
});

export const SelectCommunicationLogsByCallsignRouter = new Router({
  matcher: (pathname) => /^\/communication-log\/[^/]+$/.test(pathname),
  name: 'communication-log-by-callsign',
  onRootMatch: async (request, _response, ctx) => {
    ctx.data = await selectCommunicationLogsByCallsign(getCallsign(request.ourl.pathname));
  },
});

export const SelectCommunicationLogBasicsByCallsignRouter = new Router({
  matcher: (pathname) => /^\/communication-log\/[^/]+\/basic$/.test(pathname),
  name: 'communication-log-basics-by-callsign',
  onRootMatch: async (request, _response, ctx) => {
    ctx.data = await selectCommunicationLogBasicsByCallsign(
      getCallsign(request.ourl.pathname, '/basic')
    );
  },
});

export const SearchCommunicationLogBasicsRouter = new Router({
  matcher: 'search-log',
  name: 'search-communication-log-basics',
  onRootMatch: async (request, _response, ctx) => {
    const query = request.ourl.searchParams.get('query') ?? '';
    if (!query || query.trim() === '') {
      ctx.data = [];
      return;
    }
    ctx.data = await searchCommunicationLogBasics(
      query
    );
  },
});


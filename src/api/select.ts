import type { Address } from '@schema/address';
import type { CallsignDetail, CommunicationLog } from '@schema/communicationLog';
import type { PaginatedResult, ServerResponse } from '@schema/utils';

export type { CallsignDetail } from '@schema/communicationLog';

export interface CommunicationLogFilters {
  qslSent?: boolean;
  qslReceived?: boolean;
  hasAddress?: boolean;
  deduplicateCallsigns?: boolean;
}

function errorMessageFromResponse(status: number, message: string = '<no-message>'): string {
  return `Failed to fetch communication logs: ${status} ${message}`;
}
async function getData<T>(response: Promise<Response> | Response): Promise<T> {
  const _response = await Promise.resolve(response);
  if (!_response.ok) {
    throw new Error(errorMessageFromResponse(_response.status, _response.statusText));
  }
  const body = (await _response.json()) as ServerResponse<T>;
  if (!body.ok) {
    throw new Error(errorMessageFromResponse(body.code, body.message));
  }
  return body.data;
}

export async function selectCommunicationLogs(
  page: number = 1,
  pageSize: number = 100,
  filters: CommunicationLogFilters = {}
): Promise<PaginatedResult<CommunicationLog>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, value.toString());
  }
  return await getData<PaginatedResult<CommunicationLog>>(
    fetch(`/api/select/communication-log?${params.toString()}`)
  );
}

export async function selectAddressesByCallsigns(callsigns: string[]): Promise<Address[]> {
  if (callsigns.length === 0) return [];

  const params = new URLSearchParams({ callsign: callsigns.join(',') });
  return await getData<Address[]>(
    fetch(`/api/select/address-query?${params.toString()}`)
  );
}

export async function selectCallsignDetail(callsign: string): Promise<CallsignDetail> {
  const params = new URLSearchParams({ callsign });
  return await getData<CallsignDetail>(
    fetch(`/api/select/callsign-detail?${params.toString()}`)
  );
}

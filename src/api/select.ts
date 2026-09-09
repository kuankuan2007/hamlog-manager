import type { Address } from '@schema/address';
import type {
  CallsignDetail,
  CommunicationLog,
  CommunicationLogSearchResult,
} from '@schema/communicationLog';
import type { QSLReceive, QSLSend } from '@schema/qsl';
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
    throw new Error(errorMessageFromResponse(body.code, body.msg));
  }
  return body.data as T;
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

export async function selectCommunicationLogsByCallsign(
  callsign: string
): Promise<CommunicationLog[]> {
  return await getData<CommunicationLog[]>(
    fetch(`/api/select/communication-log/${encodeURIComponent(callsign)}`)
  );
}

export async function selectUnsentQSLCommunicationLogs(): Promise<CommunicationLog[]> {
  const pageSize = 500;
  const filters: CommunicationLogFilters = {
    qslSent: false,
    hasAddress: true,
    deduplicateCallsigns: true,
  };

  const firstPage = await selectCommunicationLogs(1, pageSize, filters);
  const items = [...firstPage.items];
  const totalPages = Math.ceil(firstPage.total / pageSize);

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await selectCommunicationLogs(page, pageSize, filters);
    items.push(...result.items);
  }

  return items;
}

export async function selectAddressesByCallsigns(callsigns: string[]): Promise<Address[]> {
  if (callsigns.length === 0) return [];

  const params = new URLSearchParams({ callsign: callsigns.join(',') });
  return await getData<Address[]>(fetch(`/api/select/address-query?${params.toString()}`));
}

export async function selectAddressByCallsign(callsign: string): Promise<Address | null> {
  return await getData<Address | null>(
    fetch(`/api/select/address/${encodeURIComponent(callsign)}`)
  );
}

export async function selectAddresses(
  page: number = 1,
  pageSize: number = 100
): Promise<PaginatedResult<Address>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  return await getData<PaginatedResult<Address>>(
    fetch(`/api/select/address?${params.toString()}`)
  );
}

export async function selectAllAddresses(): Promise<Address[]> {
  const pageSize = 500;
  const firstPage = await selectAddresses(1, pageSize);
  const items = [...firstPage.items];
  const totalPages = Math.ceil(firstPage.total / pageSize);

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await selectAddresses(page, pageSize);
    items.push(...result.items);
  }

  return items;
}

export async function selectQSLSends(): Promise<QSLSend[]> {
  return await getData<QSLSend[]>(fetch('/api/select/qsl-send'));
}

export async function selectQSLSendById(id: number): Promise<QSLSend | null> {
  return await getData<QSLSend | null>(fetch(`/api/select/qsl-send/id/${id}`));
}

export async function selectQSLReceives(): Promise<QSLReceive[]> {
  return await getData<QSLReceive[]>(fetch('/api/select/qsl-receive'));
}

export async function selectQSLReceiveById(id: number): Promise<QSLReceive | null> {
  return await getData<QSLReceive | null>(fetch(`/api/select/qsl-receive/id/${id}`));
}

export async function selectCallsignDetail(callsign: string): Promise<CallsignDetail> {
  const params = new URLSearchParams({ callsign });
  return await getData<CallsignDetail>(fetch(`/api/select/callsign-detail?${params.toString()}`));
}
export async function searchCallsign(
  query: string,
  abortController?: AbortController
): Promise<CommunicationLogSearchResult[]> {
  const params = new URLSearchParams({ query });
  return await getData<CommunicationLogSearchResult[]>(
    fetch(`/api/select/search-log?${params.toString()}`, { signal: abortController?.signal })
  );
}

import type { CommunicationLog } from '@schema/communicationLog';
import type { PaginatedResult, ServerResponse } from '@schema/utils';

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
  pageSize: number = 100
): Promise<PaginatedResult<CommunicationLog>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  return await getData<PaginatedResult<CommunicationLog>>(
    fetch(`/api/select/communication-log?${params.toString()}`)
  );
}

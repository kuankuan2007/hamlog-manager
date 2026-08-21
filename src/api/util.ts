import type { ServerResponse } from '@schema/utils';

export function errorMessageFromResponse(status: number, message: string = '<no-message>'): string {
  return `Failed to fetch communication logs: ${status} ${message}`;
}
export async function getData<T>(response: Promise<Response> | Response): Promise<T> {
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
export async function sendData<T>(url: string, data: T) {
  const _response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!_response.ok) {
    throw new Error(errorMessageFromResponse(_response.status, _response.statusText));
  }
  const body = (await _response.json()) as ServerResponse<T>;
  if (!body.ok) {
    throw new Error(errorMessageFromResponse(body.code, body.message));
  }
}

export interface PaginatedResult<T> {
	items: T[];
	page: number;
	pageSize: number;
	total: number;
}
export interface ServerResponse<T> {
  ok: boolean;
  code: number;
	msg?: string;
	data?: T;
}

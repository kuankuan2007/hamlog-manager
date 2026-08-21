import { all, get, normalizeCallsign, ready } from './index';
import type { Address } from '@schema/address';
import type { CallsignDetail, CommunicationLog, QSLReceive, QSLSend, CommunicationLogBasic, CommunicationLogSearchBasic, CommunicationLogSearchResult } from '@schema/communicationLog';
import type { PaginatedResult } from '@schema/utils';

export interface CommunicationLogFilters {
	qslSent?: boolean;
	qslReceived?: boolean;
	hasAddress?: boolean;
	deduplicateCallsigns?: boolean;
}

export interface AddressRow extends Address {
	id: number;
}

export interface QSLSendRow extends QSLSend {
	id: number;
}

export interface QSLReceiveRow extends QSLReceive {
	id: number;
}

interface CommunicationLogRow {
	id: number;
	sequenceNumber: number;
	time: string;
	callsign: string;
	frequency: number;
	mode: string;
	rxReport: number;
	txReport: number;
	summary: string | null;
	addressId: number | null;
	qslSendId: number | null;
	qslReceiveId: number | null;
}

const communicationLogColumns = `
		log.id,
		log.sequence_number AS sequenceNumber,
		log.time,
		log.callsign,
		log.frequency,
		log.mode,
		log.rx_report AS rxReport,
		log.tx_report AS txReport,
		log.summary,
		log.address_id AS addressId,
		log.qsl_send_id AS qslSendId,
		log.qsl_receive_id AS qslReceiveId
`;

function getPagination(page: number, pageSize: number) {
	const normalizedPage = Math.max(1, Math.floor(page));
	const normalizedPageSize = Math.max(1, Math.floor(pageSize));

	return {
		page: normalizedPage,
		pageSize: normalizedPageSize,
		offset: (normalizedPage - 1) * normalizedPageSize,
	};
}

function normalizeCallsigns(callsigns: string[]): string[] {
	return [...new Set(callsigns.map(normalizeCallsign).filter(Boolean))];
}

export function findAddressByCallsign(callsign: string): Promise<AddressRow | undefined> {
	return get<AddressRow>(
		`SELECT id, callsign, postal_code AS postalCode, address,
				recipient_name AS recipientName, updated_at AS updatedAt
		 FROM addresses
		 WHERE callsign = ?`,
		[callsign]
	);
}

export function findLatestQSLSendByCallsign(callsign: string): Promise<QSLSendRow | undefined> {
	return get<QSLSendRow>(
		`SELECT id, callsign, sent_at AS sentAt, confirmed_at AS confirmedAt
		 FROM qsl_sends
		 WHERE callsign = ?
		 ORDER BY sent_at DESC, id DESC
		 LIMIT 1`,
		[callsign]
	);
}

export function findLatestQSLReceiveByCallsign(callsign: string): Promise<QSLReceiveRow | undefined> {
	return get<QSLReceiveRow>(
		`SELECT id, callsign, received_at AS receivedAt
		 FROM qsl_receives
		 WHERE callsign = ?
		 ORDER BY received_at DESC, id DESC
		 LIMIT 1`,
		[callsign]
	);
}

function getCommunicationLogFilterConditions(filters: CommunicationLogFilters): string[] {
	const conditions: string[] = [];
	if (filters.qslSent !== undefined) {
		conditions.push(`qsl_send_id IS ${filters.qslSent ? 'NOT ' : ''}NULL`);
	}
	if (filters.qslReceived !== undefined) {
		conditions.push(`qsl_receive_id IS ${filters.qslReceived ? 'NOT ' : ''}NULL`);
	}
	if (filters.hasAddress !== undefined) {
		conditions.push(`address_id IS ${filters.hasAddress ? 'NOT ' : ''}NULL`);
	}
	return conditions;
}

function getCommunicationLogFilterQuery(filters: CommunicationLogFilters): {
	from: string;
	where: string;
} {
	const filterConditions = getCommunicationLogFilterConditions(filters);
	const filterWhere = filterConditions.length === 0 ? '' : ` WHERE ${filterConditions.join(' AND ')}`;
	if (!filters.deduplicateCallsigns) {
		return { from: 'communication_logs AS log', where: filterWhere };
	}

	return {
		from: `(
			SELECT *, ROW_NUMBER() OVER (
				PARTITION BY callsign
				ORDER BY time DESC, id DESC
			) AS callsignRank
			FROM communication_logs${filterWhere}
		) AS log`,
		where: ' WHERE log.callsignRank = 1',
	};
}

function toCommunicationLog(row: CommunicationLogRow): CommunicationLog {
	return {
		id: row.id,
		sequenceNumber: row.sequenceNumber,
		time: row.time,
		callsign: row.callsign,
		frequency: row.frequency,
		mode: row.mode,
		rxReport: row.rxReport,
		txReport: row.txReport,
		summary: row.summary ?? undefined,
		hasAddress: row.addressId !== null,
		qslReceived: row.qslReceiveId !== null,
		qslSent: row.qslSendId !== null,
	};
}

export async function selectCommunicationLogs(
	page = 1,
	pageSize = 100,
	filters: CommunicationLogFilters = {}
): Promise<PaginatedResult<CommunicationLog>> {
	await ready;
	const pagination = getPagination(page, pageSize);
	const filterQuery = getCommunicationLogFilterQuery(filters);
	const [rows, count] = await Promise.all([
		all<CommunicationLogRow>(
			`SELECT ${communicationLogColumns}
			 FROM ${filterQuery.from}${filterQuery.where}
			 ORDER BY log.time DESC, log.id DESC
			 LIMIT ? OFFSET ?`,
			[pagination.pageSize, pagination.offset]
		),
		get<{ total: number }>(
			`SELECT COUNT(*) AS total FROM ${filterQuery.from}${filterQuery.where}`
		),
	]);

	return { ...pagination, items: rows.map(toCommunicationLog), total: count?.total ?? 0 };
}

export async function selectCommunicationLogBasicsByCallsign(
	callsign: string
): Promise<CommunicationLogBasic[]> {
	await ready;
	const normalizedCallsign = normalizeCallsign(callsign);
	return all<CommunicationLogBasic>(
		`SELECT substr(time, 1, 10) AS date, callsign, frequency
		 FROM communication_logs
		 WHERE callsign = ?
		 ORDER BY time DESC, id DESC`,
		[normalizedCallsign]
	);
}

export async function searchCommunicationLogBasics(
	query: string
): Promise<CommunicationLogSearchResult[]> {
	await ready;
	const normalizedQuery = normalizeCallsign(query);
	if (normalizedQuery.length === 0) return [];

	const rows = await all<CommunicationLogSearchBasic>(
		`SELECT callsign, time, frequency
		 FROM communication_logs
		 WHERE instr(callsign, ?) > 0
		 ORDER BY
			CASE
				WHEN callsign = ? THEN 1
				WHEN substr(callsign, 1, length(?)) = ? THEN 2
				WHEN substr(callsign, -length(?)) = ? THEN 3
				WHEN length(?) <= 3 AND substr(callsign, -3, length(?)) = ? THEN 4
				WHEN instr(callsign, ?) > 0 THEN 5
				ELSE 6
			END,
			callsign ASC,
			time DESC,
			id DESC`,
		[
			normalizedQuery,
			normalizedQuery,
			normalizedQuery,
			normalizedQuery,
			normalizedQuery,
			normalizedQuery,
			normalizedQuery,
			normalizedQuery,
			normalizedQuery,
			normalizedQuery,
		],
	);

	const results: CommunicationLogSearchResult[] = [];
	for (const row of rows) {
		const result = results.at(-1);
		if (result?.callsign === row.callsign) {
			result.logs.push(row);
		} else {
			results.push({ callsign: row.callsign, logs: [row] });
		}
	}

	return results;
}

export async function selectCommunicationLogsByCallsign(callsign: string): Promise<CommunicationLog[]> {
	await ready;
	const normalizedCallsign = normalizeCallsign(callsign);
	const rows = await all<CommunicationLogRow>(
		`SELECT ${communicationLogColumns}
		 FROM communication_logs AS log
		 WHERE log.callsign = ?
		 ORDER BY log.time DESC, log.id DESC`,
		[normalizedCallsign]
	);
	return rows.map(toCommunicationLog);
}

export async function selectAddresses(
	page = 1,
	pageSize = 100
): Promise<PaginatedResult<Address>> {
	await ready;
	const pagination = getPagination(page, pageSize);
	const [items, count] = await Promise.all([
		all<Address>(
			`SELECT callsign, postal_code AS postalCode, address,
							recipient_name AS recipientName, updated_at AS updatedAt
			 FROM addresses
			 ORDER BY callsign ASC
			 LIMIT ? OFFSET ?`,
			[pagination.pageSize, pagination.offset]
		),
		get<{ total: number }>('SELECT COUNT(*) AS total FROM addresses'),
	]);

	return { ...pagination, items, total: count?.total ?? 0 };
}

export async function selectAddressByCallsign(callsign: string): Promise<Address | null> {
	await ready;
	const normalizedCallsign = normalizeCallsign(callsign);
	const address = await get<Address>(
		`SELECT callsign, postal_code AS postalCode, address,
						recipient_name AS recipientName, updated_at AS updatedAt
		 FROM addresses
		 WHERE callsign = ?`,
		[normalizedCallsign]
	);
	return address ?? null;
}

export async function selectAddressesByCallsigns(callsigns: string[]): Promise<Address[]> {
	await ready;
	const normalizedCallsigns = normalizeCallsigns(callsigns);
	if (normalizedCallsigns.length === 0) return [];

	return all<Address>(
		`SELECT callsign, postal_code AS postalCode, address,
					recipient_name AS recipientName, updated_at AS updatedAt
		 FROM addresses
		 WHERE callsign IN (${normalizedCallsigns.map(() => '?').join(', ')})
		 ORDER BY callsign ASC`,
		normalizedCallsigns
	);
}

export async function selectQSLReceives(): Promise<QSLReceive[]> {
	await ready;
	return all<QSLReceive>(
		'SELECT callsign, received_at AS receivedAt FROM qsl_receives ORDER BY received_at DESC, id DESC'
	);
}

export async function selectQSLReceivesByCallsign(callsign: string): Promise<QSLReceive[]> {
	await ready;
	const normalizedCallsign = normalizeCallsign(callsign);
	return all<QSLReceive>(
		`SELECT callsign, received_at AS receivedAt
		 FROM qsl_receives
		 WHERE callsign = ?
		 ORDER BY received_at DESC, id DESC`,
		[normalizedCallsign]
	);
}

export async function selectQSLReceivesByCallsigns(callsigns: string[]): Promise<QSLReceive[]> {
	await ready;
	const normalizedCallsigns = normalizeCallsigns(callsigns);
	if (normalizedCallsigns.length === 0) return [];

	return all<QSLReceive>(
		`SELECT callsign, received_at AS receivedAt
		 FROM qsl_receives
		 WHERE callsign IN (${normalizedCallsigns.map(() => '?').join(', ')})
		 ORDER BY received_at DESC, id DESC`,
		normalizedCallsigns
	);
}

export async function selectQSLSends(): Promise<QSLSend[]> {
	await ready;
	return all<QSLSend>(
		`SELECT callsign, sent_at AS sentAt, confirmed_at AS confirmedAt
		 FROM qsl_sends
		 ORDER BY sent_at DESC, id DESC`
	);
}

export async function selectQSLSendsByCallsign(callsign: string): Promise<QSLSend[]> {
	await ready;
	const normalizedCallsign = normalizeCallsign(callsign);
	return all<QSLSend>(
		`SELECT callsign, sent_at AS sentAt, confirmed_at AS confirmedAt
		 FROM qsl_sends
		 WHERE callsign = ?
		 ORDER BY sent_at DESC, id DESC`,
		[normalizedCallsign]
	);
}

export async function selectQSLSendsByCallsigns(callsigns: string[]): Promise<QSLSend[]> {
	await ready;
	const normalizedCallsigns = normalizeCallsigns(callsigns);
	if (normalizedCallsigns.length === 0) return [];

	return all<QSLSend>(
		`SELECT callsign, sent_at AS sentAt, confirmed_at AS confirmedAt
		 FROM qsl_sends
		 WHERE callsign IN (${normalizedCallsigns.map(() => '?').join(', ')})
		 ORDER BY sent_at DESC, id DESC`,
		normalizedCallsigns
	);
}

export async function selectCallsignDetail(callsign: string): Promise<CallsignDetail> {
	const normalizedCallsign = normalizeCallsign(callsign);
	const [communicationLogs, addresses, qslSends, qslReceives] = await Promise.all([
		selectCommunicationLogsByCallsign(normalizedCallsign),
		selectAddressesByCallsigns([normalizedCallsign]),
		selectQSLSendsByCallsign(normalizedCallsign),
		selectQSLReceivesByCallsign(normalizedCallsign),
	]);

	return {
		basic: {
			callsign: normalizedCallsign,
			communicationCount: communicationLogs.length,
			firstCommunicationAt: communicationLogs.at(-1)?.time ?? null,
			lastCommunicationAt: communicationLogs[0]?.time ?? null,
		},
		communicationLogs,
		addresses,
		qslSends,
		qslReceives,
	};
}

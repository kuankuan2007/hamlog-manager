import { resolve } from 'node:path';
import sqlite3 from 'sqlite3';
import type { Address, CommunicationLog, QSLReceive, QSLSend } from './type';

const databasePath = resolve(process.cwd(), 'data/logbook.db');

export interface PaginatedResult<T> {
	items: T[];
	page: number;
	pageSize: number;
	total: number;
}

export interface CommunicationLogBasic {
	date: string;
	callsign: string;
	frequency: number;
}

interface CommunicationLogRow {
	id: number;
	time: string;
	callsign: string;
	frequency: number;
	mode: string;
	rxReport: number;
	txReport: number;
	summary: string | null;
	addressCallsign: string | null;
	postalCode: string | null;
	addressText: string | null;
	recipientName: string | null;
	updatedAt: string | null;
	qslSendCallsign: string | null;
	sentAt: string | null;
	qslReceiveCallsign: string | null;
	receivedAt: string | null;
}

const communicationLogSelect = `
	SELECT
		log.id,
		log.time,
		log.callsign,
		log.frequency,
		log.mode,
		log.rx_report AS rxReport,
		log.tx_report AS txReport,
		log.summary,
		address.callsign AS addressCallsign,
		address.postal_code AS postalCode,
		address.address AS addressText,
		address.recipient_name AS recipientName,
		address.updated_at AS updatedAt,
		qsl_send.callsign AS qslSendCallsign,
		qsl_send.sent_at AS sentAt,
		qsl_receive.callsign AS qslReceiveCallsign,
		qsl_receive.received_at AS receivedAt
	FROM communication_logs AS log
	LEFT JOIN addresses AS address ON address.id = log.address_id
	LEFT JOIN qsl_sends AS qsl_send ON qsl_send.id = log.qsl_send_id
	LEFT JOIN qsl_receives AS qsl_receive ON qsl_receive.id = log.qsl_receive_id
`;

const database = new sqlite3.Database(databasePath);

const ready = run(`
	CREATE INDEX IF NOT EXISTS idx_communication_logs_callsign_time_frequency
	ON communication_logs(callsign, time, frequency)
`);

function run(sql: string, parameters: unknown[] = []): Promise<void> {
	return new Promise((resolvePromise, reject) => {
		database.run(sql, parameters, (error) => (error ? reject(error) : resolvePromise()));
	});
}

function all<T>(sql: string, parameters: unknown[] = []): Promise<T[]> {
	return new Promise((resolvePromise, reject) => {
		database.all(sql, parameters, (error, rows) => {
			if (error) reject(error);
			else resolvePromise(rows as T[]);
		});
	});
}

function get<T>(sql: string, parameters: unknown[] = []): Promise<T | undefined> {
	return new Promise((resolvePromise, reject) => {
		database.get(sql, parameters, (error, row) => {
			if (error) reject(error);
			else resolvePromise(row as T | undefined);
		});
	});
}

function getPagination(page: number, pageSize: number) {
	const normalizedPage = Math.max(1, Math.floor(page));
	const normalizedPageSize = Math.max(1, Math.floor(pageSize));

	return {
		page: normalizedPage,
		pageSize: normalizedPageSize,
		offset: (normalizedPage - 1) * normalizedPageSize,
	};
}

function normalizeCallsign(callsign: string): string {
	return callsign.toUpperCase();
}

function toCommunicationLog(row: CommunicationLogRow): CommunicationLog {
	const address: Address | undefined = row.addressCallsign === null
		? undefined
		: {
				callsign: row.addressCallsign,
				postalCode: row.postalCode ?? '',
				address: row.addressText ?? '',
				recipientName: row.recipientName ?? undefined,
				updatedAt: row.updatedAt ?? '',
			};
	const qslSent: QSLSend | null = row.qslSendCallsign === null
		? null
		: { callsign: row.qslSendCallsign, sentAt: row.sentAt ?? '' };
	const qslReceived: QSLReceive | null = row.qslReceiveCallsign === null
		? null
		: { callsign: row.qslReceiveCallsign, receivedAt: row.receivedAt ?? '' };

	return {
		sequenceNumber: row.id,
		time: row.time,
		callsign: row.callsign,
		frequency: row.frequency,
		mode: row.mode,
		rxReport: row.rxReport,
		txReport: row.txReport,
		summary: row.summary ?? undefined,
		qslReceived,
		qslSent,
		address,
	};
}

export async function selectCommunicationLogs(
	page = 1,
	pageSize = 100
): Promise<PaginatedResult<CommunicationLog>> {
	await ready;
	const pagination = getPagination(page, pageSize);
	const [rows, count] = await Promise.all([
		all<CommunicationLogRow>(
			`${communicationLogSelect} ORDER BY log.time DESC, log.id DESC LIMIT ? OFFSET ?`,
			[pagination.pageSize, pagination.offset]
		),
		get<{ total: number }>('SELECT COUNT(*) AS total FROM communication_logs'),
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

export async function selectCommunicationLogsByCallsign(callsign: string): Promise<CommunicationLog[]> {
	await ready;
	const normalizedCallsign = normalizeCallsign(callsign);
	const rows = await all<CommunicationLogRow>(
		`${communicationLogSelect} WHERE log.callsign = ? ORDER BY log.time DESC, log.id DESC`,
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

export async function selectQSLSends(): Promise<QSLSend[]> {
	await ready;
	return all<QSLSend>(
		'SELECT callsign, sent_at AS sentAt FROM qsl_sends ORDER BY sent_at DESC, id DESC'
	);
}

export async function selectQSLSendsByCallsign(callsign: string): Promise<QSLSend[]> {
	await ready;
	const normalizedCallsign = normalizeCallsign(callsign);
	return all<QSLSend>(
		`SELECT callsign, sent_at AS sentAt
		 FROM qsl_sends
		 WHERE callsign = ?
		 ORDER BY sent_at DESC, id DESC`,
		[normalizedCallsign]
	);
}

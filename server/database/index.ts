import { dirname, resolve } from 'node:path';
import sqlite3 from 'sqlite3';
import { mkdir } from 'node:fs/promises';
import {
	databasePath as configuredDatabasePath,
	publicDatabasePath as configuredPublicDatabasePath,
	selfInfo,
} from '@server/config';

export const databasePath = resolve(process.cwd(), configuredDatabasePath);
export const publicDatabasePath = resolve(process.cwd(), configuredPublicDatabasePath);
if (databasePath === publicDatabasePath) {
	throw new Error('Personal and public database paths must be different');
}

let database: sqlite3.Database | undefined;
let publicDatabase: sqlite3.Database | undefined;

process.on('exit', () => {
	database?.close(() => undefined);
	publicDatabase?.close(() => undefined);
});

function getDatabase(): sqlite3.Database {
	if (database === undefined) {
		throw new Error('Database has not been initialized');
	}

	return database;
}

function getPublicDatabase(): sqlite3.Database {
	if (publicDatabase === undefined) {
		throw new Error('Public database has not been initialized');
	}

	return publicDatabase;
}

export function run(sql: string, parameters: unknown[] = []): Promise<void> {
	return new Promise((resolvePromise, reject) => {
		getDatabase().run(sql, parameters, (error) => (error ? reject(error) : resolvePromise()));
	});
}

export function runAndGetId(sql: string, parameters: unknown[] = []): Promise<number> {
	return new Promise((resolvePromise, reject) => {
		getDatabase().run(sql, parameters, function onRun(error) {
			if (error) {
				reject(error);
				return;
			}

			resolvePromise(this.lastID);
		});
	});
}

export function all<T>(sql: string, parameters: unknown[] = []): Promise<T[]> {
	return new Promise((resolvePromise, reject) => {
		getDatabase().all(sql, parameters, (error, rows) => {
			if (error) reject(error);
			else resolvePromise(rows as T[]);
		});
	});
}

export function get<T>(sql: string, parameters: unknown[] = []): Promise<T | undefined> {
	return new Promise((resolvePromise, reject) => {
		getDatabase().get(sql, parameters, (error, row) => {
			if (error) reject(error);
			else resolvePromise(row as T | undefined);
		});
	});
}

export function publicRun(sql: string, parameters: unknown[] = []): Promise<void> {
	return new Promise((resolvePromise, reject) => {
		getPublicDatabase().run(sql, parameters, (error) => (error ? reject(error) : resolvePromise()));
	});
}

export function publicRunAndGetId(sql: string, parameters: unknown[] = []): Promise<number> {
	return new Promise((resolvePromise, reject) => {
		getPublicDatabase().run(sql, parameters, function onRun(error) {
			if (error) {
				reject(error);
				return;
			}

			resolvePromise(this.lastID);
		});
	});
}

export function publicAll<T>(sql: string, parameters: unknown[] = []): Promise<T[]> {
	return new Promise((resolvePromise, reject) => {
		getPublicDatabase().all(sql, parameters, (error, rows) => {
			if (error) reject(error);
			else resolvePromise(rows as T[]);
		});
	});
}

export function publicGet<T>(sql: string, parameters: unknown[] = []): Promise<T | undefined> {
	return new Promise((resolvePromise, reject) => {
		getPublicDatabase().get(sql, parameters, (error, row) => {
			if (error) reject(error);
			else resolvePromise(row as T | undefined);
		});
	});
}

export async function initializePublicDatabase(): Promise<void> {
	if (publicDatabase !== undefined) {
		throw new Error('Public database has already been initialized');
	}

	await mkdir(dirname(publicDatabasePath), { recursive: true });
	publicDatabase = new sqlite3.Database(publicDatabasePath);
	try {
		await publicRun('PRAGMA journal_mode = WAL');
		await publicRun('PRAGMA foreign_keys = ON');
		await publicRun('BEGIN IMMEDIATE');
		try {
			await migratePublicTable('addresses', `
				CREATE TABLE addresses (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					callsign TEXT NOT NULL,
					postal_code TEXT NOT NULL,
					address TEXT NOT NULL,
					recipient_name TEXT,
					updated_at TEXT,
					updated_by TEXT NOT NULL
				)
			`);
			await migratePublicTable('callsign_email_cache', `
				CREATE TABLE callsign_email_cache (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					callsign TEXT NOT NULL,
					email TEXT NOT NULL,
					updated_at TEXT NOT NULL,
					provider TEXT NOT NULL,
					updated_by TEXT NOT NULL
				)
			`);
			await publicRun(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_callsign_updated_by
				ON addresses(callsign, updated_by)
			`);
			await publicRun(`
				CREATE INDEX IF NOT EXISTS idx_addresses_callsign_owner_updated_at
				ON addresses(callsign, updated_by, updated_at DESC, id DESC)
			`);
			await publicRun(`
				CREATE INDEX IF NOT EXISTS idx_callsign_email_cache_callsign_owner_updated_at
				ON callsign_email_cache(callsign, updated_by, updated_at DESC, id DESC)
			`);
			await publicRun(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_callsign_email_cache_email_owner_nocase
				ON callsign_email_cache(email COLLATE NOCASE, updated_by)
			`);
			await publicRun('PRAGMA user_version = 1');
			await publicRun('COMMIT');
		} catch (error) {
			await publicRun('ROLLBACK');
			throw error;
		}
	} catch (error) {
		const instance = publicDatabase;
		publicDatabase = undefined;
		await new Promise<void>((resolvePromise) => instance?.close(() => resolvePromise()));
		throw error;
	}
}

async function migratePublicTable(tableName: 'addresses' | 'callsign_email_cache', createSql: string): Promise<void> {
	const table = await publicGet<{ name: string }>(
		"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
		[tableName]
	);
	if (table === undefined) {
		await publicRun(createSql);
		return;
	}

	const columns = await publicAll<{ name: string }>(`PRAGMA table_info(${tableName})`);
	if (columns.some((column) => column.name === 'updated_by')) return;

	const legacyTableName = `${tableName}_legacy`;
	await publicRun(`ALTER TABLE ${tableName} RENAME TO ${legacyTableName}`);
	await publicRun(createSql);
	if (tableName === 'addresses') {
		await publicRun(`
			INSERT INTO addresses (id, callsign, postal_code, address, recipient_name, updated_at, updated_by)
			SELECT id, callsign, postal_code, address, recipient_name, updated_at, ?
			FROM ${legacyTableName}
		`, [selfInfo.callsign.toUpperCase()]);
	} else {
		await publicRun(`
			INSERT INTO callsign_email_cache (id, callsign, email, updated_at, provider, updated_by)
			SELECT id, callsign, email, updated_at, provider, ?
			FROM ${legacyTableName}
		`, [selfInfo.callsign.toUpperCase()]);
	}
}

export function normalizeCallsign(callsign: string): string {
	return callsign.toUpperCase();
}

export interface WalCheckpointState {
	busy: number;
	log: number;
	checkpointed: number;
}

export async function checkpointDatabase(): Promise<WalCheckpointState> {
	const checkpointState = await get<WalCheckpointState>('PRAGMA wal_checkpoint(TRUNCATE)');
	if (checkpointState === undefined) {
		throw new Error('Unable to run WAL checkpoint');
	}

	return checkpointState;
}

export async function checkpointPublicDatabase(): Promise<WalCheckpointState> {
	const checkpointState = await publicGet<WalCheckpointState>('PRAGMA wal_checkpoint(TRUNCATE)');
	if (checkpointState === undefined) {
		throw new Error('Unable to run public database WAL checkpoint');
	}

	return checkpointState;
}

async function migrateDatabase(): Promise<void> {
	await run('BEGIN IMMEDIATE');
	try {
		const qslSendColumns = await all<{ name: string }>('PRAGMA table_info(qsl_sends)');
		if (!qslSendColumns.some((column) => column.name === 'confirmed_at')) {
			await run('ALTER TABLE qsl_sends ADD COLUMN confirmed_at TEXT');
		}
		if (!qslSendColumns.some((column) => column.name === 'status')) {
			await run(
				"ALTER TABLE qsl_sends ADD COLUMN status TEXT DEFAULT NULL CHECK (status IN ('received', 'returned', 'not_received'))"
			);
		}
		if (!qslSendColumns.some((column) => column.name === 'tracking_number')) {
			await run('ALTER TABLE qsl_sends ADD COLUMN tracking_number TEXT DEFAULT NULL');
		}
		const communicationLogColumns = await all<{ name: string }>(
			'PRAGMA table_info(communication_logs)'
		);
		let hasCommunicationLogSequenceNumber = communicationLogColumns.some(
			(column) => column.name === 'sequence_number'
		);
		const communicationLogForeignKeys = await all<{ from: string; table: string }>(
			'PRAGMA foreign_key_list(communication_logs)'
		);
		if (
			communicationLogForeignKeys.some(
				(foreignKey) =>
					foreignKey.from === 'qsl_send_id' && foreignKey.table === 'qsl_sends_legacy'
			)
		) {
			await run('ALTER TABLE communication_logs RENAME TO communication_logs_legacy');
			await run(`
				CREATE TABLE communication_logs (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					time TEXT NOT NULL,
					callsign TEXT NOT NULL,
					frequency REAL NOT NULL,
					mode TEXT NOT NULL,
					rx_report INTEGER NOT NULL,
					tx_report INTEGER NOT NULL,
					summary TEXT,
					address_id INTEGER,
					qsl_send_id INTEGER,
					qsl_receive_id INTEGER,
					sequence_number INTEGER NOT NULL DEFAULT 0,
					FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL ON UPDATE CASCADE,
					FOREIGN KEY (qsl_send_id) REFERENCES qsl_sends(id) ON DELETE SET NULL ON UPDATE CASCADE,
					FOREIGN KEY (qsl_receive_id) REFERENCES qsl_receives(id) ON DELETE SET NULL ON UPDATE CASCADE
				)
			`);
			await run(`
				INSERT INTO communication_logs (
					id, time, callsign, frequency, mode, rx_report, tx_report, summary,
					address_id, qsl_send_id, qsl_receive_id, sequence_number
				)
				SELECT
					legacy.id,
					legacy.time,
					legacy.callsign,
					legacy.frequency,
					legacy.mode,
					legacy.rx_report,
					legacy.tx_report,
					legacy.summary,
					CASE
						WHEN legacy.address_id IS NULL
							OR EXISTS (SELECT 1 FROM addresses WHERE id = legacy.address_id)
						THEN legacy.address_id
						ELSE NULL
					END,
					CASE
						WHEN legacy.qsl_send_id IS NULL
							OR EXISTS (SELECT 1 FROM qsl_sends WHERE id = legacy.qsl_send_id)
						THEN legacy.qsl_send_id
						ELSE NULL
					END,
					CASE
						WHEN legacy.qsl_receive_id IS NULL
							OR EXISTS (SELECT 1 FROM qsl_receives WHERE id = legacy.qsl_receive_id)
						THEN legacy.qsl_receive_id
						ELSE NULL
					END,
					${hasCommunicationLogSequenceNumber ? 'legacy.sequence_number' : '0'}
				FROM communication_logs_legacy AS legacy
			`);
			await run('DROP TABLE communication_logs_legacy');
			if (!hasCommunicationLogSequenceNumber) {
				await run(`
					WITH numbered AS (
						SELECT id, ROW_NUMBER() OVER (ORDER BY time ASC, id ASC) AS sequence_number
						FROM communication_logs
					)
					UPDATE communication_logs
					SET sequence_number = (
						SELECT numbered.sequence_number
						FROM numbered
						WHERE numbered.id = communication_logs.id
					)
				`);
			}
			hasCommunicationLogSequenceNumber = true;
		}
		if (!hasCommunicationLogSequenceNumber) {
			await run(
				'ALTER TABLE communication_logs ADD COLUMN sequence_number INTEGER NOT NULL DEFAULT 0'
			);
			await run(`
				WITH numbered AS (
					SELECT id, ROW_NUMBER() OVER (ORDER BY time ASC, id ASC) AS sequence_number
					FROM communication_logs
				)
				UPDATE communication_logs
				SET sequence_number = (
					SELECT numbered.sequence_number
					FROM numbered
					WHERE numbered.id = communication_logs.id
				)
			`);
		}
		await run(`
			CREATE INDEX IF NOT EXISTS idx_communication_logs_time
			ON communication_logs(time)
		`);
		await run(`
			CREATE INDEX IF NOT EXISTS idx_communication_logs_callsign
			ON communication_logs(callsign)
		`);
		await run(`
			CREATE INDEX IF NOT EXISTS idx_communication_logs_callsign_time_id
			ON communication_logs(callsign, time, id)
		`);
		if (communicationLogColumns.some((column) => column.name === 'address_id')) {
			await run(`
				CREATE INDEX IF NOT EXISTS idx_communication_logs_address_id
				ON communication_logs(address_id)
			`);
		}
		await run(`
			CREATE INDEX IF NOT EXISTS idx_communication_logs_qsl_send_id
			ON communication_logs(qsl_send_id)
		`);
		await run(`
			CREATE INDEX IF NOT EXISTS idx_communication_logs_qsl_receive_id
			ON communication_logs(qsl_receive_id)
		`);
		await run(`
			CREATE UNIQUE INDEX IF NOT EXISTS idx_communication_logs_sequence_number
			ON communication_logs(sequence_number)
		`);
		await run(`
			CREATE INDEX IF NOT EXISTS idx_communication_logs_time_id
			ON communication_logs(time DESC, id DESC)
		`);
		await run('PRAGMA user_version = 7');
		await run('COMMIT');
	} catch (error) {
		await run('ROLLBACK');
		throw error;
	}
}

export function initializeDatabase(): Promise<void> {
	if (database !== undefined) {
		return Promise.reject(new Error('Database has already been initialized'));
	}

	const instance = new sqlite3.Database(databasePath);
	database = instance;

	return run('ATTACH DATABASE ? AS public', [publicDatabasePath])
		.then(() => run('PRAGMA foreign_keys = ON'))
		.then(migrateDatabase)
		.then(() => run(`
			CREATE INDEX IF NOT EXISTS idx_communication_logs_callsign_time_frequency
			ON communication_logs(callsign, time, frequency)
		`));
}

export function closeDatabase(): Promise<void> {
	const instance = database;
	const publicInstance = publicDatabase;
	database = undefined;
	publicDatabase = undefined;
	if (instance === undefined && publicInstance === undefined) {
		return Promise.resolve();
	}

	return Promise.all([
		instance === undefined
			? Promise.resolve()
			: new Promise<void>((resolvePromise) => instance.close(() => resolvePromise())),
		publicInstance === undefined
			? Promise.resolve()
			: new Promise<void>((resolvePromise) => publicInstance.close(() => resolvePromise())),
	]).then(() => undefined);
}

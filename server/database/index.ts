import { resolve } from 'node:path';
import sqlite3 from 'sqlite3';

const databasePath = resolve(process.cwd(), 'data/logbook.db');

export const database = new sqlite3.Database(databasePath);

process.on('exit', () => {
	database.close();
});

export function run(sql: string, parameters: unknown[] = []): Promise<void> {
	return new Promise((resolvePromise, reject) => {
		database.run(sql, parameters, (error) => (error ? reject(error) : resolvePromise()));
	});
}

export function runAndGetId(sql: string, parameters: unknown[] = []): Promise<number> {
	return new Promise((resolvePromise, reject) => {
		database.run(sql, parameters, function onRun(error) {
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
		database.all(sql, parameters, (error, rows) => {
			if (error) reject(error);
			else resolvePromise(rows as T[]);
		});
	});
}

export function get<T>(sql: string, parameters: unknown[] = []): Promise<T | undefined> {
	return new Promise((resolvePromise, reject) => {
		database.get(sql, parameters, (error, row) => {
			if (error) reject(error);
			else resolvePromise(row as T | undefined);
		});
	});
}

export function normalizeCallsign(callsign: string): string {
	return callsign.toUpperCase();
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
				"ALTER TABLE qsl_sends ADD COLUMN status TEXT DEFAULT NULL CHECK (status IN ('received', 'returned'))"
			);
		}
		if (!qslSendColumns.some((column) => column.name === 'tracking_number')) {
			await run('ALTER TABLE qsl_sends ADD COLUMN tracking_number TEXT DEFAULT NULL');
		}
		await run(`
			CREATE TABLE IF NOT EXISTS callsign_email_cache (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				callsign TEXT NOT NULL,
				email TEXT NOT NULL,
				updated_at TEXT NOT NULL,
				provider TEXT NOT NULL
			)
		`);
		await run(`
			CREATE INDEX IF NOT EXISTS idx_callsign_email_cache_callsign_updated_at_id
			ON callsign_email_cache(callsign, updated_at DESC, id DESC)
		`);

		const communicationLogColumns = await all<{ name: string }>(
			'PRAGMA table_info(communication_logs)'
		);
		if (!communicationLogColumns.some((column) => column.name === 'sequence_number')) {
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
			CREATE UNIQUE INDEX IF NOT EXISTS idx_communication_logs_sequence_number
			ON communication_logs(sequence_number)
		`);
		await run(`
			CREATE INDEX IF NOT EXISTS idx_communication_logs_time_id
			ON communication_logs(time DESC, id DESC)
		`);
		await run('PRAGMA user_version = 4');
		await run('COMMIT');
	} catch (error) {
		await run('ROLLBACK');
		throw error;
	}
}

export const ready = run('PRAGMA foreign_keys = ON')
	.then(migrateDatabase)
	.then(() => run(`
		CREATE INDEX IF NOT EXISTS idx_communication_logs_callsign_time_frequency
		ON communication_logs(callsign, time, frequency)
	`));

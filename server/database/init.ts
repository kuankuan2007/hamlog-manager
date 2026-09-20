import { mkdir, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import sqlite3 from 'sqlite3';
import { databasePath } from './index';

const initialDatabaseScript = `
	PRAGMA journal_mode = WAL;

	CREATE TABLE addresses (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		callsign TEXT NOT NULL UNIQUE,
		postal_code TEXT NOT NULL,
		address TEXT NOT NULL,
		recipient_name TEXT,
		updated_at TEXT
	);

	CREATE TABLE qsl_sends (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		callsign TEXT NOT NULL,
		sent_at TEXT NOT NULL,
		note TEXT DEFAULT NULL,
		confirmed_at TEXT DEFAULT NULL,
		status TEXT DEFAULT NULL CHECK (status IN ('received', 'returned', 'not_received')),
		tracking_number TEXT DEFAULT NULL
	);

	CREATE TABLE qsl_receives (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		callsign TEXT NOT NULL,
		received_at TEXT NOT NULL,
		note TEXT
	);

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
	);

	CREATE TABLE callsign_email_cache (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		callsign TEXT NOT NULL,
		email TEXT NOT NULL,
		updated_at TEXT NOT NULL,
		provider TEXT NOT NULL
	);

	CREATE INDEX idx_addresses_callsign
	ON addresses(callsign);

	CREATE INDEX idx_communication_logs_time
	ON communication_logs(time);

	CREATE INDEX idx_communication_logs_time_id
	ON communication_logs(time DESC, id DESC);

	CREATE UNIQUE INDEX idx_communication_logs_sequence_number
	ON communication_logs(sequence_number);

	CREATE INDEX idx_communication_logs_callsign
	ON communication_logs(callsign);

	CREATE INDEX idx_communication_logs_callsign_time_id
	ON communication_logs(callsign, time, id);

	CREATE INDEX idx_communication_logs_callsign_time_frequency
	ON communication_logs(callsign, time, frequency);

	CREATE INDEX idx_communication_logs_address_id
	ON communication_logs(address_id);

	CREATE INDEX idx_communication_logs_qsl_send_id
	ON communication_logs(qsl_send_id);

	CREATE INDEX idx_communication_logs_qsl_receive_id
	ON communication_logs(qsl_receive_id);

	CREATE INDEX idx_qsl_sends_callsign
	ON qsl_sends(callsign);

	CREATE INDEX idx_qsl_receives_callsign
	ON qsl_receives(callsign);

	CREATE INDEX idx_callsign_email_cache_callsign_updated_at_id
	ON callsign_email_cache(callsign, updated_at DESC, id DESC);

	CREATE UNIQUE INDEX idx_callsign_email_cache_email_nocase
	ON callsign_email_cache(email COLLATE NOCASE);

	PRAGMA user_version = 6;
`;

/**
 * Creates a fresh database file with the complete current schema.
 *
 * Only intended for deployments without an existing `data/logbook.db`;
 * the caller must guarantee that the file does not exist yet. The
 * partially created file is removed again when the script fails.
 */
export async function createInitialDatabase(): Promise<void> {
	await mkdir(dirname(databasePath), { recursive: true });

	const database = new sqlite3.Database(databasePath);
	const closeDatabase = () =>
		new Promise<void>((resolvePromise) => {
			database.close(() => resolvePromise());
		});

	try {
		await new Promise<void>((resolvePromise, reject) => {
			database.exec(initialDatabaseScript, (error) =>
				error ? reject(error) : resolvePromise()
			);
		});
		await closeDatabase();
	} catch (error) {
		await closeDatabase();
		await rm(databasePath, { force: true });
		await rm(`${databasePath}-shm`, { force: true });
		await rm(`${databasePath}-wal`, { force: true });
		throw error;
	}
}

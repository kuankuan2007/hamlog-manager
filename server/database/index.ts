import { resolve } from 'node:path';
import sqlite3 from 'sqlite3';

const databasePath = resolve(process.cwd(), 'data/logbook.db');

export const database = new sqlite3.Database(databasePath);

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

export const ready = run('PRAGMA foreign_keys = ON').then(() => run(`
	CREATE INDEX IF NOT EXISTS idx_communication_logs_callsign_time_frequency
	ON communication_logs(callsign, time, frequency)
`));

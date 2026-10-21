import { selfInfo } from '@server/config';
import { all, get, normalizeCallsign, publicGet, publicRun } from './index';

interface LegacyAddressRow {
	callsign: string;
	postalCode: string;
	address: string;
	recipientName: string | null;
	updatedAt: string | null;
}

interface LegacyEmailRow {
	callsign: string;
	email: string;
	updatedAt: string;
	provider: string;
}

export interface PublicDataMigrationCounts {
	inserted: number;
	duplicates: number;
	conflictsSkipped: number;
	overwritten: number;
}

export interface PublicDataMigrationResult {
	addresses: PublicDataMigrationCounts;
	emails: PublicDataMigrationCounts;
}

interface AddressConflictRow extends LegacyAddressRow {
	updatedBy: string;
}

interface EmailConflictRow extends LegacyEmailRow {
	updatedBy: string;
}

function createCounts(): PublicDataMigrationCounts {
	return { inserted: 0, duplicates: 0, conflictsSkipped: 0, overwritten: 0 };
}

async function tableExists(tableName: string): Promise<boolean> {
	const table = await get<{ name: string }>(
		"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
		[tableName]
	);
	return table !== undefined;
}

async function hasMigrationColumns(
	tableName: 'addresses' | 'callsign_email_cache',
	requiredColumns: string[],
	warn: (message: string) => void,
): Promise<boolean> {
	if (!(await tableExists(tableName))) {
		warn(`Skipping legacy ${tableName} migration: table is missing`);
		return false;
	}

	const columns = await all<{ name: string }>(`PRAGMA table_info(${tableName})`);
	const columnNames = new Set(columns.map((column) => column.name));
	const missingColumns = requiredColumns.filter((column) => !columnNames.has(column));
	if (missingColumns.length > 0) {
		warn(
			`Skipping legacy ${tableName} migration: incompatible table format; missing columns: ${missingColumns.join(', ')}`,
		);
		return false;
	}

	return true;
}

async function readLegacyAddresses(): Promise<LegacyAddressRow[]> {
	return all<LegacyAddressRow>(`
		SELECT callsign, postal_code AS postalCode, address,
			recipient_name AS recipientName, updated_at AS updatedAt
		FROM addresses
		ORDER BY callsign ASC
	`);
}

async function readLegacyEmails(): Promise<LegacyEmailRow[]> {
	return all<LegacyEmailRow>(`
		SELECT callsign, email, updated_at AS updatedAt, provider
		FROM callsign_email_cache
		ORDER BY updated_at ASC, id ASC
	`);
}

export async function migrateLegacyPublicData(
	overwrite: boolean,
	warn: (message: string) => void
): Promise<PublicDataMigrationResult> {
	const hasAddressTable = await hasMigrationColumns(
		'addresses',
		['callsign', 'postal_code', 'address', 'recipient_name', 'updated_at'],
		warn,
	);
	const hasEmailTable = await hasMigrationColumns(
		'callsign_email_cache',
		['id', 'callsign', 'email', 'updated_at', 'provider'],
		warn,
	);
	const [legacyAddresses, legacyEmails] = await Promise.all([
		hasAddressTable ? readLegacyAddresses() : Promise.resolve([]),
		hasEmailTable ? readLegacyEmails() : Promise.resolve([]),
	]);
	const updatedBy = normalizeCallsign(selfInfo.callsign);
	const result: PublicDataMigrationResult = {
		addresses: createCounts(),
		emails: createCounts(),
	};

	await publicRun('BEGIN IMMEDIATE');
	try {
		for (const source of legacyAddresses) {
			const row = { ...source, callsign: normalizeCallsign(source.callsign), updatedBy };
			const existing = await publicGet<AddressConflictRow>(
				`SELECT callsign, postal_code AS postalCode, address,
					recipient_name AS recipientName, updated_at AS updatedAt,
					updated_by AS updatedBy
				 FROM addresses
				 WHERE callsign = ? AND updated_by = ?`,
				[row.callsign, updatedBy]
			);
			if (existing === undefined) {
				await publicRun(
					`INSERT INTO addresses (
						callsign, postal_code, address, recipient_name, updated_at, updated_by
					) VALUES (?, ?, ?, ?, ?, ?)`,
					[row.callsign, row.postalCode, row.address, row.recipientName, row.updatedAt, updatedBy]
				);
				result.addresses.inserted += 1;
				continue;
			}

			const differingFields = [
				...(existing.postalCode !== row.postalCode ? ['postal_code'] : []),
				...(existing.address !== row.address ? ['address'] : []),
				...(existing.recipientName !== row.recipientName ? ['recipient_name'] : []),
			];
			if (differingFields.length === 0) {
				await publicRun(
					`UPDATE addresses SET updated_at = CASE
						WHEN updated_at IS NULL OR (? IS NOT NULL AND ? > updated_at) THEN ?
						ELSE updated_at END
					 WHERE callsign = ? AND updated_by = ?`,
					[row.updatedAt, row.updatedAt, row.updatedAt, row.callsign, updatedBy]
				);
				result.addresses.duplicates += 1;
				continue;
			}
			warn(`Public address conflict for ${row.callsign} (${updatedBy}); differing fields: ${differingFields.join(', ')}${overwrite ? '; overwriting row' : '; row skipped'}`);

			if (!overwrite) {
				result.addresses.conflictsSkipped += 1;
				continue;
			}

			await publicRun(
				`UPDATE addresses
				 SET postal_code = ?, address = ?, recipient_name = ?, updated_at = ?
				 WHERE callsign = ? AND updated_by = ?`,
				[row.postalCode, row.address, row.recipientName, row.updatedAt, row.callsign, updatedBy]
			);
			result.addresses.overwritten += 1;
		}

		for (const source of legacyEmails) {
			const row = {
				...source,
				callsign: normalizeCallsign(source.callsign),
				email: source.email.trim(),
				updatedBy,
			};
			const existing = await publicGet<EmailConflictRow>(
				`SELECT callsign, email, updated_at AS updatedAt, provider,
					updated_by AS updatedBy
				 FROM callsign_email_cache
				 WHERE email = ? COLLATE NOCASE AND updated_by = ?`,
				[row.email, updatedBy]
			);
			if (existing === undefined) {
				await publicRun(
					`INSERT INTO callsign_email_cache (callsign, email, updated_at, provider, updated_by)
					 VALUES (?, ?, ?, ?, ?)`,
					[row.callsign, row.email, row.updatedAt, row.provider, updatedBy]
				);
				result.emails.inserted += 1;
				continue;
			}

			const differingFields = [
				...(existing.callsign !== row.callsign ? ['callsign'] : []),
				...(existing.provider !== row.provider ? ['provider'] : []),
			];
			if (differingFields.length === 0) {
				await publicRun(
					`UPDATE callsign_email_cache SET updated_at = CASE
						WHEN ? > updated_at THEN ? ELSE updated_at END
					 WHERE email = ? COLLATE NOCASE AND updated_by = ?`,
					[row.updatedAt, row.updatedAt, row.email, updatedBy]
				);
				result.emails.duplicates += 1;
				continue;
			}
			warn(`Public email conflict for callsign ${row.callsign} (${updatedBy}); differing fields: ${differingFields.join(', ')}${overwrite ? '; overwriting row' : '; row skipped'}`);

			if (!overwrite) {
				result.emails.conflictsSkipped += 1;
				continue;
			}

			await publicRun(
				`UPDATE callsign_email_cache
				 SET callsign = ?, email = ?, updated_at = ?, provider = ?
				 WHERE email = ? COLLATE NOCASE AND updated_by = ?`,
				[row.callsign, row.email, row.updatedAt, row.provider, row.email, updatedBy]
			);
			result.emails.overwritten += 1;
		}

		await publicRun('COMMIT');
		return result;
	} catch (error) {
		await publicRun('ROLLBACK');
		throw error;
	}
}

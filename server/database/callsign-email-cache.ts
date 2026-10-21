import { normalizeCallsign, publicGet, publicRun } from './index';
import { selfInfo } from '@server/config';

export interface CallsignEmailCache {
	callsign: string;
	email: string;
	updatedAt: string;
	provider: string;
	updatedBy: string;
}

interface CallsignEmailCacheRow extends CallsignEmailCache {
	id: number;
}

function normalizeEmail(email: string): string {
	return email.trim();
}

async function selectLatestCallsignEmailCacheRow(
	callsign: string,
	provider?: string,
	onlyOwnData = false
): Promise<CallsignEmailCacheRow | undefined> {
	const providerFilter = provider === undefined ? '' : ' AND provider = ?';
	const ownerFilter = onlyOwnData ? ' AND updated_by = ?' : '';
	const parameters = [normalizeCallsign(callsign)];
	if (provider !== undefined) parameters.push(provider);
	if (onlyOwnData) parameters.push(normalizeCallsign(selfInfo.callsign));
	parameters.push(normalizeCallsign(selfInfo.callsign));
	return publicGet<CallsignEmailCacheRow>(
		`SELECT id, callsign, email, updated_at AS updatedAt, provider,
				updated_by AS updatedBy
		 FROM callsign_email_cache
		 WHERE callsign = ?${providerFilter}${ownerFilter}
		 ORDER BY (updated_by = ?) DESC, updated_at DESC, id DESC
		 LIMIT 1`,
		parameters
	);
}

export async function selectLatestCallsignEmailCache(
	callsign: string
): Promise<CallsignEmailCache | null> {
	const cache = await selectLatestCallsignEmailCacheRow(callsign);
	if (cache === undefined) return null;
	return {
		callsign: cache.callsign,
		email: cache.email,
		updatedAt: cache.updatedAt,
		provider: cache.provider,
		updatedBy: cache.updatedBy,
	};
}

export async function selectLatestCallsignByEmail(
	email: string
): Promise<CallsignEmailCache | null> {
	const normalizedEmail = normalizeEmail(email);
	const cache = await publicGet<CallsignEmailCacheRow>(
		`SELECT id, callsign, email, updated_at AS updatedAt, provider,
				updated_by AS updatedBy
		 FROM callsign_email_cache
		 WHERE email = ? COLLATE NOCASE
		 ORDER BY (updated_by = ?) DESC, updated_at DESC, id DESC
		 LIMIT 1`,
		[normalizedEmail, normalizeCallsign(selfInfo.callsign)]
	);
	if (cache === undefined) return null;
	return {
		callsign: cache.callsign,
		email: cache.email,
		updatedAt: cache.updatedAt,
		provider: cache.provider,
		updatedBy: cache.updatedBy,
	};
}

export async function insertCallsignEmailCache(
	cache: Omit<CallsignEmailCache, 'updatedBy'>
): Promise<CallsignEmailCache> {
	const normalizedCache = {
		...cache,
		callsign: normalizeCallsign(cache.callsign),
		email: normalizeEmail(cache.email),
		updatedBy: normalizeCallsign(selfInfo.callsign),
	};
	const latestCache = await selectLatestCallsignEmailCacheRow(
		normalizedCache.callsign,
		normalizedCache.provider,
		true
	);
	if (latestCache?.email === normalizedCache.email) {
		await publicRun('UPDATE callsign_email_cache SET updated_at = ? WHERE id = ?', [
			normalizedCache.updatedAt,
			latestCache.id,
		]);
		return {
			callsign: latestCache.callsign,
			email: latestCache.email,
			updatedAt: normalizedCache.updatedAt,
			provider: latestCache.provider,
			updatedBy: latestCache.updatedBy,
		};
	}
	const emailCache = await publicGet<CallsignEmailCacheRow>(
		`SELECT id, callsign, email, updated_at AS updatedAt, provider,
				updated_by AS updatedBy
		 FROM callsign_email_cache
		 WHERE email = ? COLLATE NOCASE AND updated_by = ?
		 ORDER BY updated_at DESC, id DESC
		 LIMIT 1`,
		[normalizedCache.email, normalizedCache.updatedBy]
	);
	if (emailCache !== undefined) {
		await publicRun(
			`UPDATE callsign_email_cache
			 SET callsign = ?, email = ?, updated_at = ?, provider = ?, updated_by = ?
			 WHERE id = ?`,
			[
				normalizedCache.callsign,
				normalizedCache.email,
				normalizedCache.updatedAt,
				normalizedCache.provider,
				normalizedCache.updatedBy,
				emailCache.id,
			]
		);
		return normalizedCache;
	}
	await publicRun(
		`INSERT INTO callsign_email_cache (callsign, email, updated_at, provider, updated_by)
		 VALUES (?, ?, ?, ?, ?)`,
		[
			normalizedCache.callsign,
			normalizedCache.email,
			normalizedCache.updatedAt,
			normalizedCache.provider,
			normalizedCache.updatedBy,
		]
	);
	return normalizedCache;
}

import { get, normalizeCallsign, run } from './index';

export interface CallsignEmailCache {
	callsign: string;
	email: string;
	updatedAt: string;
	provider: string;
}

interface CallsignEmailCacheRow extends CallsignEmailCache {
	id: number;
}

function normalizeEmail(email: string): string {
	return email.trim();
}

async function selectLatestCallsignEmailCacheRow(
	callsign: string,
	provider?: string
): Promise<CallsignEmailCacheRow | undefined> {
	const providerFilter = provider === undefined ? '' : ' AND provider = ?';
	return get<CallsignEmailCacheRow>(
		`SELECT id, callsign, email, updated_at AS updatedAt, provider
		 FROM callsign_email_cache
		 WHERE callsign = ?${providerFilter}
		 ORDER BY updated_at DESC, id DESC
		 LIMIT 1`,
		provider === undefined
			? [normalizeCallsign(callsign)]
			: [normalizeCallsign(callsign), provider]
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
	};
}

export async function selectLatestCallsignByEmail(
	email: string
): Promise<CallsignEmailCache | null> {
	const normalizedEmail = normalizeEmail(email);
	const cache = await get<CallsignEmailCacheRow>(
		`SELECT id, callsign, email, updated_at AS updatedAt, provider
		 FROM callsign_email_cache
		 WHERE email = ? COLLATE NOCASE
		 ORDER BY updated_at DESC, id DESC
		 LIMIT 1`,
		[normalizedEmail]
	);
	if (cache === undefined) return null;
	return {
		callsign: cache.callsign,
		email: cache.email,
		updatedAt: cache.updatedAt,
		provider: cache.provider,
	};
}

export async function insertCallsignEmailCache(
	cache: CallsignEmailCache
): Promise<CallsignEmailCache> {
	const normalizedCache = {
		...cache,
		callsign: normalizeCallsign(cache.callsign),
		email: normalizeEmail(cache.email),
	};
	const latestCache = await selectLatestCallsignEmailCacheRow(
		normalizedCache.callsign,
		normalizedCache.provider
	);
	if (latestCache?.email === normalizedCache.email) {
		await run('UPDATE callsign_email_cache SET updated_at = ? WHERE id = ?', [
			normalizedCache.updatedAt,
			latestCache.id,
		]);
		return {
			callsign: latestCache.callsign,
			email: latestCache.email,
			updatedAt: normalizedCache.updatedAt,
			provider: latestCache.provider,
		};
	}
	const emailCache = await selectLatestCallsignByEmail(normalizedCache.email);
	if (emailCache !== null) {
		await run(
			`UPDATE callsign_email_cache
			 SET callsign = ?, email = ?, updated_at = ?, provider = ?
			 WHERE email = ? COLLATE NOCASE`,
			[
				normalizedCache.callsign,
				normalizedCache.email,
				normalizedCache.updatedAt,
				normalizedCache.provider,
				normalizedCache.email,
			]
		);
		return normalizedCache;
	}
	await run(
		`INSERT INTO callsign_email_cache (callsign, email, updated_at, provider)
		 VALUES (?, ?, ?, ?)`,
		[
			normalizedCache.callsign,
			normalizedCache.email,
			normalizedCache.updatedAt,
			normalizedCache.provider,
		]
	);
	return normalizedCache;
}

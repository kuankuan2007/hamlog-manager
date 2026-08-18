import { get, normalizeCallsign, ready, run } from './index';

export interface CallsignEmailCache {
	callsign: string;
	email: string;
	updatedAt: string;
	provider: string;
}

export async function selectLatestCallsignEmailCache(
	callsign: string
): Promise<CallsignEmailCache | null> {
	await ready;
	const cache = await get<CallsignEmailCache>(
		`SELECT callsign, email, updated_at AS updatedAt, provider
		 FROM callsign_email_cache
		 WHERE callsign = ?
		 ORDER BY updated_at DESC, id DESC
		 LIMIT 1`,
		[normalizeCallsign(callsign)]
	);
	return cache ?? null;
}

export async function insertCallsignEmailCache(
	cache: CallsignEmailCache
): Promise<CallsignEmailCache> {
	const normalizedCache = { ...cache, callsign: normalizeCallsign(cache.callsign) };
	await ready;
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

import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ResolvedConfig } from 'vite';
import { readExcelFile, type LogBook } from './data/read';

const API_PREFIX = '/api';
const LOG_BOOK_FIELDS = [
	'communicationLogs',
	'addresses',
	'qslSends',
	'qslReceives',
] as const satisfies readonly (keyof LogBook)[];

type LogBookField = (typeof LOG_BOOK_FIELDS)[number];

function sendJson(response: ServerResponse, statusCode: number, data: unknown): void {
	response.statusCode = statusCode;
	response.setHeader('Content-Type', 'application/json; charset=utf-8');
	response.end(JSON.stringify(data));
}

function getLogBookField(pathname: string): LogBookField | undefined {
	const field = pathname.startsWith(`${API_PREFIX}/`)
		? pathname.slice(API_PREFIX.length + 1)
		: '';

	return LOG_BOOK_FIELDS.find((candidate) => candidate === field);
}

function createMiddleware(logFilePath: () => string) {
	return (request: IncomingMessage, response: ServerResponse, next: () => void): void => {
		const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
		const field = getLogBookField(pathname);

		if (!field) {
			next();
			return;
		}

		if (request.method !== 'GET') {
			response.setHeader('Allow', 'GET');
			sendJson(response, 405, { error: 'Method Not Allowed' });
			return;
		}

		try {
			sendJson(response, 200, readExcelFile(logFilePath())[field]);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			sendJson(response, 500, { error: 'Failed to read ham log', message });
		}
	};
}

export default function VitePluginHamLog(logFilePath: string): Plugin {
	let config: ResolvedConfig;
	const resolvedLogFilePath = () =>
		path.isAbsolute(logFilePath) ? logFilePath : path.resolve(config.root, logFilePath);

	return {
		name: 'vite-plugin-hamlog',
		configResolved(resolvedConfig) {
			config = resolvedConfig;
		},
		configureServer(server) {
			server.middlewares.use(createMiddleware(resolvedLogFilePath));
		},
		configurePreviewServer(server) {
			server.middlewares.use(createMiddleware(resolvedLogFilePath));
		},
	};
}

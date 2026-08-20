import type {
	ConfirmQSLSendInput,
	CreateCommunicationLogInput,
	CreateQSLReceiveInput,
	CreateQSLSendInput,
} from '../../schema/communicationLog';
import type { CreateAddressInput } from '../../schema/address';
import type { Address } from '../../schema/address';
import type { CommunicationLog, QSLReceive, QSLSend } from '../../schema/communicationLog';
import {
	formatCreateAddressInputErrors,
	formatCreateCommunicationLogInputErrors,
	formatDateInputErrors,
	validateCreateAddressInput,
	validateConfirmQSLSendInput,
	validateCreateCommunicationLogInput,
	validateCreateQSLReceiveInput,
	validateCreateQSLSendInput,
} from '../schema';
import { normalizeCallsign, ready, run, runAndGetId } from './index';
import {
	findAddressByCallsign,
	findLatestQSLReceiveByCallsign,
	findLatestQSLSendByCallsign,
} from './select';

export class QSLSendNotFoundError extends Error {
	constructor(callsign: string) {
		super(`No QSL send record found for callsign: ${callsign}`);
		this.name = 'QSLSendNotFoundError';
	}
}

export async function upsertAddress(input: CreateAddressInput): Promise<Address> {
	const normalizedInput: CreateAddressInput = {
		...input,
		callsign: normalizeCallsign(input.callsign),
	};

	if (!validateCreateAddressInput(normalizedInput)) {
		throw new Error(
			`Invalid address input: ${formatCreateAddressInputErrors(validateCreateAddressInput.errors)}`
		);
	}

	await ready;
	await run('BEGIN');
	try {
		await run(
			`INSERT INTO addresses (callsign, postal_code, address, recipient_name, updated_at)
			 VALUES (?, ?, ?, ?, ?)
			 ON CONFLICT(callsign) DO UPDATE SET
				postal_code = excluded.postal_code,
				address = excluded.address,
				recipient_name = excluded.recipient_name,
				updated_at = excluded.updated_at`,
			[
				normalizedInput.callsign,
				normalizedInput.postalCode,
				normalizedInput.address,
				normalizedInput.recipientName ?? null,
				normalizedInput.updatedAt,
			]
		);
		const address = await findAddressByCallsign(normalizedInput.callsign);
		await run(
			`UPDATE communication_logs
			 SET address_id = ?
			 WHERE callsign = ? AND address_id IS NULL`,
			[address?.id ?? null, normalizedInput.callsign]
		);
		await run('COMMIT');
	} catch (error) {
		await run('ROLLBACK');
		throw error;
	}

	return normalizedInput;
}

export async function insertQSLSend(input: CreateQSLSendInput): Promise<QSLSend> {
	const normalizedInput: CreateQSLSendInput = {
		...input,
		callsign: normalizeCallsign(input.callsign),
	};

	if (!validateCreateQSLSendInput(normalizedInput)) {
		throw new Error(`Invalid QSL send input: ${formatDateInputErrors(validateCreateQSLSendInput.errors, 'sentAt')}`);
	}

	await ready;
	await run('BEGIN');
	try {
		const qslSendId = await runAndGetId(
			'INSERT INTO qsl_sends (callsign, sent_at, confirmed_at) VALUES (?, ?, NULL)',
			[normalizedInput.callsign, normalizedInput.sentAt]
		);
		await run(
			`UPDATE communication_logs
			 SET qsl_send_id = ?
			 WHERE callsign = ? AND qsl_send_id IS NULL`,
			[qslSendId, normalizedInput.callsign]
		);
		await run('COMMIT');
	} catch (error) {
		await run('ROLLBACK');
		throw error;
	}
	return { ...normalizedInput, confirmedAt: null };
}

export async function insertQSLReceive(input: CreateQSLReceiveInput): Promise<QSLReceive> {
	const normalizedInput: CreateQSLReceiveInput = {
		...input,
		callsign: normalizeCallsign(input.callsign),
	};

	if (!validateCreateQSLReceiveInput(normalizedInput)) {
		throw new Error(`Invalid QSL receive input: ${formatDateInputErrors(validateCreateQSLReceiveInput.errors, 'receivedAt')}`);
	}

	await ready;
	await run('BEGIN');
	try {
		const qslReceiveId = await runAndGetId(
			'INSERT INTO qsl_receives (callsign, received_at) VALUES (?, ?)',
			[normalizedInput.callsign, normalizedInput.receivedAt]
		);
		await run(
			`UPDATE communication_logs
			 SET qsl_receive_id = ?
			 WHERE callsign = ? AND qsl_receive_id IS NULL`,
			[qslReceiveId, normalizedInput.callsign]
		);
		await run('COMMIT');
	} catch (error) {
		await run('ROLLBACK');
		throw error;
	}
	return normalizedInput;
}

export async function confirmLatestQSLSend(input: ConfirmQSLSendInput): Promise<QSLSend> {
	const normalizedInput: ConfirmQSLSendInput = {
		...input,
		callsign: normalizeCallsign(input.callsign),
	};

	if (!validateConfirmQSLSendInput(normalizedInput)) {
		throw new Error(`Invalid QSL send confirmation input: ${formatDateInputErrors(validateConfirmQSLSendInput.errors, 'confirmedAt')}`);
	}

	await ready;
	const qslSend = await findLatestQSLSendByCallsign(normalizedInput.callsign);
	if (qslSend === undefined) {
		throw new QSLSendNotFoundError(normalizedInput.callsign);
	}

	await run('UPDATE qsl_sends SET confirmed_at = ? WHERE id = ?', [
		normalizedInput.confirmedAt,
		qslSend.id,
	]);
	return {
		callsign: qslSend.callsign,
		sentAt: qslSend.sentAt,
		confirmedAt: normalizedInput.confirmedAt,
	};
}

export async function insertCommunicationLog(
	input: CreateCommunicationLogInput
): Promise<CommunicationLog> {
	const normalizedInput: CreateCommunicationLogInput = {
		...input,
		callsign: normalizeCallsign(input.callsign),
	};

	if (!validateCreateCommunicationLogInput(normalizedInput)) {
		throw new Error(
			`Invalid communication log input: ${formatCreateCommunicationLogInputErrors(validateCreateCommunicationLogInput.errors)}`
		);
	}

	await ready;
	await run('BEGIN');

	try {
		const callsign = normalizedInput.callsign;
		const [address, qslSent, qslReceived] = await Promise.all([
			findAddressByCallsign(callsign),
			findLatestQSLSendByCallsign(callsign),
			findLatestQSLReceiveByCallsign(callsign),
		]);
		const addressId = address?.id ?? null;
		const qslSendId = qslSent?.id ?? null;
		const qslReceiveId = qslReceived?.id ?? null;
		const sequenceNumber = await runAndGetId(
			`INSERT INTO communication_logs (
				time, callsign, frequency, mode, rx_report, tx_report, summary,
				address_id, qsl_send_id, qsl_receive_id
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				normalizedInput.time,
				callsign,
				normalizedInput.frequency,
				normalizedInput.mode,
				normalizedInput.rxReport,
				normalizedInput.txReport,
				normalizedInput.summary ?? null,
				addressId,
				qslSendId,
				qslReceiveId,
			]
		);

		await run('COMMIT');
		return {
			...normalizedInput,
			sequenceNumber,
			callsign,
			hasAddress: address !== undefined,
			qslSent: qslSent !== undefined,
			qslReceived: qslReceived !== undefined,
		};
	} catch (error) {
		await run('ROLLBACK');
		throw error;
	}
}

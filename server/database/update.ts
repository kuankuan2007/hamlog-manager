import type { CreateCommunicationLogInput } from '../../schema/communicationLog';
import {
	formatCreateCommunicationLogInputErrors,
	validateCreateCommunicationLogInput,
} from '../schema';
import { get, normalizeCallsign, ready, run, runAndGetId } from './index';
import type { Address, CommunicationLog, QSLReceive, QSLSend } from './type';

interface AddressRow extends Address {
	id: number;
}

interface QSLSendRow extends QSLSend {
	id: number;
}

interface QSLReceiveRow extends QSLReceive {
	id: number;
}

function findAddressByCallsign(callsign: string): Promise<AddressRow | undefined> {
	return get<AddressRow>(
		`SELECT id, callsign, postal_code AS postalCode, address,
				recipient_name AS recipientName, updated_at AS updatedAt
		 FROM addresses
		 WHERE callsign = ?`,
		[callsign]
	);
}

function findLatestQSLSendByCallsign(callsign: string): Promise<QSLSendRow | undefined> {
	return get<QSLSendRow>(
		`SELECT id, callsign, sent_at AS sentAt
		 FROM qsl_sends
		 WHERE callsign = ?
		 ORDER BY sent_at DESC, id DESC
		 LIMIT 1`,
		[callsign]
	);
}

function findLatestQSLReceiveByCallsign(callsign: string): Promise<QSLReceiveRow | undefined> {
	return get<QSLReceiveRow>(
		`SELECT id, callsign, received_at AS receivedAt
		 FROM qsl_receives
		 WHERE callsign = ?
		 ORDER BY received_at DESC, id DESC
		 LIMIT 1`,
		[callsign]
	);
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
			address: address === undefined
				? undefined
				: {
					callsign: address.callsign,
					postalCode: address.postalCode,
					address: address.address,
					recipientName: address.recipientName,
					updatedAt: address.updatedAt,
				},
			qslSent: qslSent === undefined
				? null
				: { callsign: qslSent.callsign, sentAt: qslSent.sentAt },
			qslReceived: qslReceived === undefined
				? null
				: { callsign: qslReceived.callsign, receivedAt: qslReceived.receivedAt },
		};
	} catch (error) {
		await run('ROLLBACK');
		throw error;
	}
}

import { all, get, ready, run } from './index';

interface SequenceNumberState {
	mismatchedRows: number;
	maximumSequenceNumber: number;
	totalRows: number;
}

interface ForeignKeyMaintenanceRow {
	id: number;
	addressId: number | null;
	expectedAddressId: number | null;
	qslSendId: number | null;
	expectedQslSendId: number | null;
	qslReceiveId: number | null;
	expectedQslReceiveId: number | null;
}

/**
 * Rebuilds the persistent sequence numbers to match `time ASC, id ASC`.
 *
 * @returns The number of rows whose sequence number was inconsistent.
 */
export async function maintainCommunicationLogSequenceNumbers(): Promise<number> {
	await ready;
	await run('BEGIN IMMEDIATE');

	try {
		const state = await get<SequenceNumberState>(`
			WITH numbered AS (
				SELECT id, ROW_NUMBER() OVER (ORDER BY time ASC, id ASC) AS expectedSequenceNumber
				FROM communication_logs
			)
			SELECT
				COUNT(*) FILTER (
					WHERE communication_logs.sequence_number <> numbered.expectedSequenceNumber
				) AS mismatchedRows,
				COALESCE(MAX(communication_logs.sequence_number), 0) AS maximumSequenceNumber,
				COUNT(*) AS totalRows
			FROM communication_logs
			JOIN numbered ON numbered.id = communication_logs.id
		`);
		if (state === undefined) {
			throw new Error('Unable to inspect communication log sequence numbers');
		}

		if (state.mismatchedRows > 0) {
			// Move every value outside both the old and final ranges first so the
			// unique index cannot be violated while rows exchange sequence numbers.
			const offset = Math.max(state.maximumSequenceNumber, state.totalRows) + 1;
			await run(
				`WITH numbered AS (
					SELECT id, ROW_NUMBER() OVER (ORDER BY time ASC, id ASC) AS expectedSequenceNumber
					FROM communication_logs
				)
				UPDATE communication_logs
				SET sequence_number = ? + (
					SELECT numbered.expectedSequenceNumber
					FROM numbered
					WHERE numbered.id = communication_logs.id
				)`,
				[offset]
			);
			await run('UPDATE communication_logs SET sequence_number = sequence_number - ?', [offset]);
		}

		await run('COMMIT');
		return state.mismatchedRows;
	} catch (error) {
		await run('ROLLBACK');
		throw error;
	}
}

/**
 * Repairs communication log foreign keys to point at the latest related rows
 * for each callsign.
 *
 * Rows are inspected in `communication_logs.id ASC` order. Any row whose
 * foreign keys differ from the expected address, latest QSL send, or latest
 * QSL receive is updated and counted as one fix.
 */
export async function maintainCommunicationLogForeignKeys(): Promise<number> {
	await ready;
	await run('BEGIN IMMEDIATE');

	try {
		const rows = await all<ForeignKeyMaintenanceRow>(`
			SELECT
				log.id,
				log.address_id AS addressId,
				(
					SELECT address.id
					FROM addresses AS address
					WHERE address.callsign = log.callsign
					ORDER BY address.updated_at DESC, address.id DESC
					LIMIT 1
				) AS expectedAddressId,
				log.qsl_send_id AS qslSendId,
				(
					SELECT qslSend.id
					FROM qsl_sends AS qslSend
					WHERE qslSend.callsign = log.callsign
					ORDER BY qslSend.sent_at DESC, qslSend.id DESC
					LIMIT 1
				) AS expectedQslSendId,
				log.qsl_receive_id AS qslReceiveId,
				(
					SELECT qslReceive.id
					FROM qsl_receives AS qslReceive
					WHERE qslReceive.callsign = log.callsign
					ORDER BY qslReceive.received_at DESC, qslReceive.id DESC
					LIMIT 1
				) AS expectedQslReceiveId
			FROM communication_logs AS log
			ORDER BY log.id ASC
		`);

		let fixed = 0;
		for (const row of rows) {
			const addressNeedsUpdate = row.addressId !== row.expectedAddressId;
			const qslSendNeedsUpdate = row.qslSendId !== row.expectedQslSendId;
			const qslReceiveNeedsUpdate = row.qslReceiveId !== row.expectedQslReceiveId;

			if (!addressNeedsUpdate && !qslSendNeedsUpdate && !qslReceiveNeedsUpdate) {
				continue;
			}

			await run(
				`UPDATE communication_logs
				 SET address_id = ?, qsl_send_id = ?, qsl_receive_id = ?
				 WHERE id = ?`,
				[
					row.expectedAddressId,
					row.expectedQslSendId,
					row.expectedQslReceiveId,
					row.id,
				]
			);
			fixed += 1;
		}

		await run('COMMIT');
		return fixed;
	} catch (error) {
		await run('ROLLBACK');
		throw error;
	}
}

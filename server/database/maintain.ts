import { get, ready, run } from './index';

interface SequenceNumberState {
	mismatchedRows: number;
	maximumSequenceNumber: number;
	totalRows: number;
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

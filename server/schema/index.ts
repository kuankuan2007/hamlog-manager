import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import { CreateAddressInputSchema, CreateAddressRequestSchema } from '../../schema/address';
import type { CreateAddressInput, CreateAddressRequest } from '../../schema/address';
import {
	CreateCommunicationLogInputSchema,
	DateTimeFormatName,
	isValidDateTime,
} from '../../schema/communicationLog';
import type { CreateCommunicationLogInput } from '../../schema/communicationLog';

export const ajv = new Ajv({ allErrors: true });
ajv.addFormat(DateTimeFormatName, { type: 'string', validate: isValidDateTime });

export const validateCreateCommunicationLogInput = ajv.compile<CreateCommunicationLogInput>(
	CreateCommunicationLogInputSchema
);

export const validateCreateAddressInput = ajv.compile<CreateAddressInput>(
	CreateAddressInputSchema
);

export const validateCreateAddressRequest = ajv.compile<CreateAddressRequest>(
	CreateAddressRequestSchema
);

export function formatCreateCommunicationLogInputErrors(
	errors: ErrorObject[] | null | undefined
): string {
	const messages: string[] = [];
	let hasTimeError = false;

	for (const error of errors ?? []) {
		const isMissingTime = error.keyword === 'required'
			&& (error.params as { missingProperty?: string }).missingProperty === 'time';
		if (error.instancePath === '/time' || isMissingTime) {
			hasTimeError = true;
			continue;
		}

		messages.push(ajv.errorsText([error]));
	}

	if (hasTimeError) messages.unshift('invalid time format');

	return messages.join(', ');
}

export function formatCreateAddressInputErrors(
	errors: ErrorObject[] | null | undefined
): string {
	return ajv.errorsText(errors);
}

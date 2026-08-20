import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import { CreateAddressInputSchema, CreateAddressRequestSchema } from '../../schema/address';
import type { CreateAddressInput, CreateAddressRequest } from '../../schema/address';
import {
  ConfirmQSLSendInputSchema,
  CreateQSLReceiveInputSchema,
  CreateQSLSendInputSchema,
  CreateCommunicationLogInputSchema,
  DateFormatName,
  DateTimeFormatName,
  isValidDate,
  isValidDateTime,
} from '../../schema/communicationLog';
import type {
  ConfirmQSLSendInput,
  CreateCommunicationLogInput,
  CreateQSLReceiveInput,
  CreateQSLSendInput,
} from '../../schema/communicationLog';

export const ajv = new Ajv({ allErrors: true });
ajv.addFormat(DateFormatName, { type: 'string', validate: isValidDate });
ajv.addFormat(DateTimeFormatName, { type: 'string', validate: isValidDateTime });

export const validateCreateCommunicationLogInput = ajv.compile<CreateCommunicationLogInput>(
  CreateCommunicationLogInputSchema
);

export const validateCreateQSLSendInput = ajv.compile<CreateQSLSendInput>(CreateQSLSendInputSchema);

export const validateCreateQSLReceiveInput = ajv.compile<CreateQSLReceiveInput>(
  CreateQSLReceiveInputSchema
);

export const validateConfirmQSLSendInput =
  ajv.compile<ConfirmQSLSendInput>(ConfirmQSLSendInputSchema);

export const validateCreateAddressInput = ajv.compile<CreateAddressInput>(CreateAddressInputSchema);

export const validateCreateAddressRequest = ajv.compile<CreateAddressRequest>(
  CreateAddressRequestSchema
);

export function formatCreateCommunicationLogInputErrors(
  errors: ErrorObject[] | null | undefined
): string {
  return formatDateInputErrors(errors, 'time', 'invalid time format');
}

export function formatDateInputErrors(
  errors: ErrorObject[] | null | undefined,
  fieldName: string,
  formatErrorMessage = 'invalid date format'
): string {
  const messages: string[] = [];
  let hasDateError = false;

  for (const error of errors ?? []) {
    const isMissingDate =
      error.keyword === 'required' &&
      (error.params as { missingProperty?: string }).missingProperty === fieldName;
    if (error.instancePath === `/${fieldName}` || isMissingDate) {
      hasDateError = true;
      continue;
    }

    messages.push(ajv.errorsText([error]));
  }

  if (hasDateError) messages.unshift(formatErrorMessage);

  return messages.join(', ');
}

export function formatCreateAddressInputErrors(errors: ErrorObject[] | null | undefined): string {
  return ajv.errorsText(errors);
}

export {
  callsign2EmailModes,
  type Callsign2EmailMode,
  type Callsign2EmailResponse,
} from '@schema/email';

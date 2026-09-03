import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import { CreateAddressRequestSchema } from '@schema/address';
import type { CreateAddressRequest } from '@schema/address';
import {
  CreateCommunicationLogInputSchema,
  DateTimeFormatName,
  isValidDateTime,
} from '@schema/communicationLog';
import type { CreateCommunicationLogInput } from '@schema/communicationLog';
import {
  ConfirmQSLSendInputSchema,
  CreateQSLReceiveInputSchema,
  CreateQSLSendInputSchema,
  DateFormatName,
  isValidDate,
} from '@schema/qsl';
import type {
  ConfirmQSLSendInput,
  CreateQSLReceiveInput,
  CreateQSLSendInput,
} from '@schema/qsl';

export const ajv = new Ajv({ allErrors: true });
ajv.addFormat(DateFormatName, { type: 'string', validate: isValidDate });
ajv.addFormat(DateTimeFormatName, { type: 'string', validate: isValidDateTime });

export const validateCreateCommunicationLogInput = ajv.compile<CreateCommunicationLogInput>(
  CreateCommunicationLogInputSchema
);

export const validateCreateQSLSendInput = ajv.compile<CreateQSLSendInput>(
  CreateQSLSendInputSchema
);

export const validateCreateQSLReceiveInput = ajv.compile<CreateQSLReceiveInput>(
  CreateQSLReceiveInputSchema
);

export const validateConfirmQSLSendInput = ajv.compile<ConfirmQSLSendInput>(
  ConfirmQSLSendInputSchema
);

export const validateCreateAddressRequest = ajv.compile<CreateAddressRequest>(
  CreateAddressRequestSchema
);

export function formatCreateAddressRequestErrors(errors: ErrorObject[] | null | undefined): string {
  return ajv.errorsText(errors);
}

export function formatCreateCommunicationLogInputErrors(
  errors: ErrorObject[] | null | undefined
): string {
  const messages: string[] = [];
  let hasTimeError = false;

  for (const error of errors ?? []) {
    const isMissingTime =
      error.keyword === 'required' &&
      (error.params as { missingProperty?: string }).missingProperty === 'time';
    if (error.instancePath === '/time' || isMissingTime) {
      hasTimeError = true;
      continue;
    }

    messages.push(ajv.errorsText([error]));
  }

  if (hasTimeError) messages.unshift('invalid time format');

  return messages.join(', ');
}

export {
  callsign2EmailModes,
  type Callsign2EmailMode,
  type Callsign2EmailResponse,
} from '@schema/email';

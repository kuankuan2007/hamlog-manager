import type { CreateAddressRequest } from '@schema/address';
import type { CreateCommunicationLogInput } from '@schema/communicationLog';
import type {
  ConfirmQSLSendInput,
  CreateQSLReceiveInput,
  CreateQSLSendInput,
} from '@schema/qsl';
export type { CreateAddressRequest } from '@schema/address';
export type { CreateCommunicationLogInput } from '@schema/communicationLog';
export type {
  ConfirmQSLSendInput,
  CreateQSLReceiveInput,
  CreateQSLSendInput,
} from '@schema/qsl';

import {
  formatCreateAddressRequestErrors,
  formatCreateCommunicationLogInputErrors,
  validateConfirmQSLSendInput,
  validateCreateAddressRequest,
  validateCreateCommunicationLogInput,
  validateCreateQSLReceiveInput,
  validateCreateQSLSendInput,
} from './schema/index';

import { sendData } from './util';

export function newAddress(options: CreateAddressRequest): Promise<void> {
  if (!validateCreateAddressRequest(options)) {
    throw new Error(formatCreateAddressRequestErrors(validateCreateAddressRequest.errors));
  }

  return sendData<CreateAddressRequest>('/api/update/new-address', options);
}

export function newCommunicationLog(options: CreateCommunicationLogInput): Promise<void> {
  if (!validateCreateCommunicationLogInput(options)) {
    throw new Error(
      formatCreateCommunicationLogInputErrors(validateCreateCommunicationLogInput.errors)
    );
  }

  return sendData<CreateCommunicationLogInput>('/api/update/new-log', options);
}

function assertValidQSLInput(valid: boolean, errors: unknown): void {
  if (!valid) throw new Error(JSON.stringify(errors));
}

export function newQSLReceive(options: CreateQSLReceiveInput): Promise<void> {
  assertValidQSLInput(validateCreateQSLReceiveInput(options), validateCreateQSLReceiveInput.errors);
  return sendData<CreateQSLReceiveInput>('/api/update/new-qsl-receive', options);
}

export function newQSLSend(options: CreateQSLSendInput): Promise<void> {
  assertValidQSLInput(validateCreateQSLSendInput(options), validateCreateQSLSendInput.errors);
  return sendData<CreateQSLSendInput>('/api/update/new-qsl-send', options);
}

export function confirmQSLSend(options: ConfirmQSLSendInput): Promise<void> {
  assertValidQSLInput(validateConfirmQSLSendInput(options), validateConfirmQSLSendInput.errors);
  return sendData<ConfirmQSLSendInput>('/api/update/confirm-qsl-send', options);
}

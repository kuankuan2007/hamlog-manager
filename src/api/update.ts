import type { Address, CreateAddressRequest } from '@schema/address';
import type { CommunicationLog, CreateCommunicationLogInput } from '@schema/communicationLog';
import type { CallsignEmailCache, ManualEmailInput } from '@schema/email';
import type {
  ConfirmQSLSendInput,
  CreateQSLReceiveInput,
  CreateQSLSendInput,
  QSLReceive,
  QSLSend,
} from '@schema/qsl';
export type { Address, CreateAddressRequest } from '@schema/address';
export type { CommunicationLog, CreateCommunicationLogInput } from '@schema/communicationLog';
export type { CallsignEmailCache, ManualEmailInput } from '@schema/email';
export type {
  ConfirmQSLSendInput,
  CreateQSLReceiveInput,
  CreateQSLSendInput,
  QSLReceive,
  QSLSend,
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

export function newAddress(options: CreateAddressRequest): Promise<Address> {
  if (!validateCreateAddressRequest(options)) {
    throw new Error(formatCreateAddressRequestErrors(validateCreateAddressRequest.errors));
  }

  return sendData<CreateAddressRequest, Address>('/api/update/new-address', options);
}

export function newCommunicationLog(
  options: CreateCommunicationLogInput
): Promise<CommunicationLog> {
  if (!validateCreateCommunicationLogInput(options)) {
    throw new Error(
      formatCreateCommunicationLogInputErrors(validateCreateCommunicationLogInput.errors)
    );
  }

  return sendData<CreateCommunicationLogInput, CommunicationLog>('/api/update/new-log', options);
}

export function manualUpdateEmail(options: ManualEmailInput): Promise<CallsignEmailCache> {
  return sendData<ManualEmailInput, CallsignEmailCache>('/api/update/manual-email', options);
}

function assertValidQSLInput(valid: boolean, errors: unknown): void {
  if (!valid) throw new Error(JSON.stringify(errors));
}

export function newQSLReceive(options: CreateQSLReceiveInput): Promise<QSLReceive> {
  assertValidQSLInput(validateCreateQSLReceiveInput(options), validateCreateQSLReceiveInput.errors);
  return sendData<CreateQSLReceiveInput, QSLReceive>('/api/update/new-qsl-receive', options);
}

export function newQSLSend(options: CreateQSLSendInput): Promise<QSLSend> {
  assertValidQSLInput(validateCreateQSLSendInput(options), validateCreateQSLSendInput.errors);
  return sendData<CreateQSLSendInput, QSLSend>('/api/update/new-qsl-send', options);
}

export function confirmQSLSend(options: ConfirmQSLSendInput): Promise<QSLSend> {
  assertValidQSLInput(validateConfirmQSLSendInput(options), validateConfirmQSLSendInput.errors);
  return sendData<ConfirmQSLSendInput, QSLSend>('/api/update/confirm-qsl-send', options);
}

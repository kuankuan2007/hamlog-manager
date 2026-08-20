import type { CreateAddressRequest } from '@schema/address';
import type { CreateCommunicationLogInput } from '@schema/communicationLog';
export type { CreateAddressRequest } from '@schema/address';
export type { CreateCommunicationLogInput } from '@schema/communicationLog';

import {
  formatCreateAddressRequestErrors,
  formatCreateCommunicationLogInputErrors,
  validateCreateAddressRequest,
  validateCreateCommunicationLogInput,
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

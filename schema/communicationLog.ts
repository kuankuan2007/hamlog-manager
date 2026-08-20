import type { Address } from './address';

export interface CommunicationLog {
  sequenceNumber: number;
  time: string;
  callsign: string;
  frequency: number;
  mode: string;
  rxReport: number;
  txReport: number;
  summary?: string;
  hasAddress: boolean;
  qslReceived: boolean;
  qslSent: boolean;
}

export interface QSLSend {
  callsign: string;
  sentAt: string;
  confirmedAt: string | null;
}

export interface QSLReceive {
  callsign: string;
  receivedAt: string;
}

export interface CreateQSLSendInput {
  callsign: string;
  sentAt: string;
}

export interface CreateQSLReceiveInput {
  callsign: string;
  receivedAt: string;
}

export interface ConfirmQSLSendInput {
  callsign: string;
  confirmedAt: string;
}

export interface LogBook {
  communicationLogs: CommunicationLog[];
  addresses: Address[];
  qslSends: QSLSend[];
  qslReceives: QSLReceive[];
}

export interface CallsignDetail {
  basic: {
    callsign: string;
    communicationCount: number;
    firstCommunicationAt: string | null;
    lastCommunicationAt: string | null;
  };
  communicationLogs: CommunicationLog[];
  addresses: Address[];
  qslSends: QSLSend[];
  qslReceives: QSLReceive[];
}

export interface CreateCommunicationLogInput {
  time: string;
  callsign: string;
  frequency: number;
  mode: string;
  rxReport: number;
  txReport: number;
  summary?: string;
}

export const datePattern = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const dateTimePattern =
  /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;
export const DateFormatName = 'hamlog-date';
export const DateTimeFormatName = 'hamlog-date-time';

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isValidDate(value: string): boolean {
  const match = datePattern.exec(value);
  if (match === null) return false;

  const [, yearText, monthText, dayText] = match;
  return Number(dayText) <= getDaysInMonth(Number(yearText), Number(monthText));
}

export function isValidDateTime(value: string): boolean {
  const match = dateTimePattern.exec(value);
  if (match === null) return false;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  return day <= getDaysInMonth(year, month) && hour <= 23 && minute <= 59;
}

export const DateTimeSchema = {
  type: 'string',
  pattern: dateTimePattern.source,
  format: DateTimeFormatName,
};

export const DateSchema = {
  type: 'string',
  pattern: datePattern.source,
  format: DateFormatName,
};

export const CreateCommunicationLogInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    time: DateTimeSchema,
    callsign: { type: 'string', minLength: 1 },
    frequency: { type: 'number' },
    mode: { type: 'string', minLength: 1 },
    rxReport: { type: 'integer', minimum: 11, maximum: 99 },
    txReport: { type: 'integer', minimum: 11, maximum: 99 },
    summary: { type: 'string' },
  },
  required: ['time', 'callsign', 'frequency', 'mode', 'rxReport', 'txReport'],
};

const QSLInputProperties = {
  callsign: { type: 'string', minLength: 1 },
};

export const CreateQSLSendInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ...QSLInputProperties,
    sentAt: DateSchema,
  },
  required: ['callsign', 'sentAt'],
};

export const CreateQSLReceiveInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ...QSLInputProperties,
    receivedAt: DateSchema,
  },
  required: ['callsign', 'receivedAt'],
};

export const ConfirmQSLSendInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ...QSLInputProperties,
    confirmedAt: DateSchema,
  },
  required: ['callsign', 'confirmedAt'],
};

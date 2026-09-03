export type QSLSendStatus = 'received' | 'returned';

export interface QSLSend {
  id: number;
  callsign: string;
  sentAt: string;
  confirmedAt: string | null;
  status: QSLSendStatus | null;
  trackingNumber: string | null;
}

export interface QSLReceive {
  id: number;
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
  id: number;
  confirmedAt: string;
  status: QSLSendStatus;
}

export const datePattern = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const DateFormatName = 'hamlog-date';

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isValidDate(value: string): boolean {
  const match = datePattern.exec(value);
  if (match === null) return false;

  const [, yearText, monthText, dayText] = match;
  return Number(dayText) <= getDaysInMonth(Number(yearText), Number(monthText));
}

export const DateSchema = {
  type: 'string',
  pattern: datePattern.source,
  format: DateFormatName,
};

const QSLInputProperties = {
  callsign: { type: 'string', minLength: 1 },
};

const QSLIdSchema = { type: 'integer', minimum: 1 };

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
    id: QSLIdSchema,
    confirmedAt: DateSchema,
    status: { type: 'string', enum: ['received', 'returned'] },
  },
  required: ['id', 'confirmedAt', 'status'],
};

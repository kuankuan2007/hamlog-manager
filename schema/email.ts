export const callsign2EmailModes = ['auto', 'cache', 'fallback', 'realtime'] as const;
export type Callsign2EmailMode = typeof callsign2EmailModes[number];

export interface ManualEmailInput {
  callsign: string;
  email: string;
}

export type EmailContentType = 'text' | 'html';

export interface SendEmailInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  contentType?: EmailContentType;
}

export const ManualEmailInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    callsign: { type: 'string', minLength: 1 },
    email: { type: 'string', minLength: 1 },
  },
  required: ['callsign', 'email'],
};

export const SendEmailInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    to: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', minLength: 1 },
    },
    cc: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
    bcc: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
    subject: { type: 'string', minLength: 1 },
    body: { type: 'string', minLength: 1 },
    contentType: {
      type: 'string',
      enum: ['text', 'html'],
    },
  },
  required: ['to', 'subject', 'body'],
};

export interface Callsign2EmailResponse {
  callsign: string;
  email: string | null;
  comeFrom?: string;
  realtime: boolean;
  lastUpdate?: string;
  mode: Callsign2EmailMode;
}

export interface Email2CallsignResponse {
  email: string;
  callsign: string | null;
  comeFrom?: string;
  realtime?: boolean;
  lastUpdate?: string;
}

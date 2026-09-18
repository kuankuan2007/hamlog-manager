export type EmailRecipientInput = string | string[] | undefined;

export interface SendEmailLinkOptions {
  title: string;
  content: string;
  to?: EmailRecipientInput;
  cc?: EmailRecipientInput;
  bcc?: EmailRecipientInput;
}

export interface SendEmailRouteProps {
  title?: string;
  content?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
}

export interface EmailPrepareLinkOptions {
  qslSendId?: number;
  qslReceiveId?: number;
  communicationLogId?: number;
}

export type EmailPrepareRouteProps = EmailPrepareLinkOptions;

function splitRecipientValue(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeEmailRecipients(value: EmailRecipientInput): string[] {
  if (value === undefined) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap(splitRecipientValue);
}

export function normalizeEmailRouteText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

export function normalizeEmailRouteRecipients(value: unknown): string[] | undefined {
  if (typeof value === 'string') {
    const recipients = normalizeEmailRecipients(value);
    return recipients.length ? recipients : undefined;
  }
  if (Array.isArray(value)) {
    const recipients = normalizeEmailRecipients(
      value.filter((item): item is string => typeof item === 'string')
    );
    return recipients.length ? recipients : undefined;
  }
  return undefined;
}

export function buildSendEmailHref(options: SendEmailLinkOptions): string {
  const params = new URLSearchParams();
  params.set('title', options.title);
  params.set('content', options.content);

  const to = normalizeEmailRecipients(options.to);
  if (to.length) params.set('to', to.join(','));

  const cc = normalizeEmailRecipients(options.cc);
  if (cc.length) params.set('cc', cc.join(','));

  const bcc = normalizeEmailRecipients(options.bcc);
  if (bcc.length) params.set('bcc', bcc.join(','));

  return `/send-email?${params.toString()}`;
}

export function buildEmailPrepareHref(options: EmailPrepareLinkOptions): string {
  const params = new URLSearchParams();
  if (options.qslSendId !== undefined) params.set('qslSendId', String(options.qslSendId));
  if (options.qslReceiveId !== undefined) params.set('qslReceiveId', String(options.qslReceiveId));
  if (options.communicationLogId !== undefined) {
    params.set('communicationLogId', String(options.communicationLogId));
  }
  const query = params.toString();
  return query ? `/email-prepare?${query}` : '/email-prepare';
}

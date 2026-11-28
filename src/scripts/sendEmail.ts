export type EmailRecipientInput = string | string[] | undefined;

export interface SendEmailLinkOptions {
  title: string;
  content: string;
  to?: EmailRecipientInput;
  cc?: EmailRecipientInput;
  bcc?: EmailRecipientInput;
}

export interface EmailDraft {
  title: string;
  content: string;
  to: string[];
  toInput: string;
  cc: string[];
  ccInput: string;
  bcc: string[];
  bccInput: string;
  contentType: 'text' | 'html';
}

const sharedDrafts = new Map<string, SendEmailLinkOptions>();
let sharedChannel: BroadcastChannel | undefined;

export function createEmailContentId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) =>
    value.toString(16).padStart(2, '0')
  ).join('');
}

export function releaseEmailDraftLink(id: string): void {
  sharedDrafts.delete(id);
  if (sharedDrafts.size === 0) {
    sharedChannel?.close();
    sharedChannel = undefined;
  }
}

export function requestEmailDraft(id: string): Promise<SendEmailLinkOptions | undefined> {
  if (typeof BroadcastChannel === 'undefined') return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const channel = new BroadcastChannel('hamlog-email-drafts');
    const requestId = createEmailContentId();
    const timer = setTimeout(() => {
      channel.close();
      resolve(undefined);
    }, 1000);
    channel.onmessage = (event: MessageEvent) => {
      if (event.data?.type !== 'response' || event.data.requestId !== requestId) return;
      clearTimeout(timer);
      channel.close();
      resolve(event.data.draft as SendEmailLinkOptions);
    };
    channel.postMessage({ type: 'request', id, requestId });
  });
}

export function readEmailDraft(id: string): EmailDraft | undefined {
  const value = sessionStorage.getItem(`email-draft:${id}`);
  return value ? (JSON.parse(value) as EmailDraft) : undefined;
}

export function saveEmailDraft(id: string, draft: EmailDraft): void {
  sessionStorage.setItem(`email-draft:${id}`, JSON.stringify(draft));
}

export interface EmailPrepareLinkOptions {
  qslSendId?: number;
  qslReceiveId?: number;
  communicationLogId?: number;
}

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

export function buildSendEmailHref(options: SendEmailLinkOptions, id: string): string {
  sharedDrafts.set(id, {
    title: options.title,
    content: options.content,
    to: options.to === undefined ? undefined : normalizeEmailRecipients(options.to),
    cc: options.cc === undefined ? undefined : normalizeEmailRecipients(options.cc),
    bcc: options.bcc === undefined ? undefined : normalizeEmailRecipients(options.bcc),
  });
  if (!sharedChannel && typeof BroadcastChannel !== 'undefined') {
    sharedChannel = new BroadcastChannel('hamlog-email-drafts');
    sharedChannel.onmessage = (event: MessageEvent) => {
      if (event.data?.type !== 'request') return;
      const draft = sharedDrafts.get(event.data.id as string);
      if (draft)
        sharedChannel?.postMessage({ type: 'response', requestId: event.data.requestId, draft });
    };
  }
  return `/send-email?email-content-id=${encodeURIComponent(id)}`;
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

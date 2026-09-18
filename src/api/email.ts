import type { SendEmailInput } from '@schema/email';
import { getData, sendData } from './util';

export interface EmailPreviewResponse {
  html: string;
}

export function previewEmail(options: SendEmailInput): Promise<EmailPreviewResponse> {
  return getData<EmailPreviewResponse>(
    fetch('/api/email/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })
  );
}

export function sendEmailRequest(options: SendEmailInput): Promise<void> {
  return sendData<SendEmailInput>('/api/email/send', options);
}

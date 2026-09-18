import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { SendEmailInput } from '@schema/email';
import { emailConfig, type SmtpConfig } from '@server/config';
import { selfInfo } from '@server/config/index';

interface ParsedEmailConfig {
  account: string;
  password: string;
  host: string;
  port: number;
  secure: boolean;
  from: string;
}

function normalizeHostAndPort(config: SmtpConfig): { host: string; port?: number } {
  const host = config.host?.trim();
  if (!host) {
    return { host: '', port: config.port };
  }

  const lastColon = host.lastIndexOf(':');
  const hasExplicitPort = lastColon > -1 && !host.includes(']') && host.slice(lastColon + 1).trim() !== '';
  if (hasExplicitPort) {
    const parsedPort = Number(host.slice(lastColon + 1));
    if (Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536) {
      return {
        host: host.slice(0, lastColon).trim(),
        port: config.port ?? parsedPort,
      };
    }
  }

  return { host, port: config.port };
}

function parseEmailConfig(config: SmtpConfig): ParsedEmailConfig {
  const account = config.email.trim();
  const password = config.password.trim();
  const { host, port: hostPort } = normalizeHostAndPort(config);

  if (!account) {
    throw new Error('email is required in config/index.ts');
  }
  if (!password) {
    throw new Error('password is required in config/index.ts');
  }
  if (!host) {
    throw new Error('host is required in config/index.ts');
  }

  const secure = config.secure ?? (hostPort === 465 || config.port === 465);
  const port = hostPort ?? config.port ?? (secure ? 465 : 587);
  const from = config.from?.trim() || account;

  return {
    account,
    password,
    host,
    port,
    secure,
    from,
  };
}

function normalizeRecipients(recipients: string[], fieldName: string): string[] {
  const normalized = recipients.map((recipient) => recipient.trim());
  if (normalized.some((recipient) => recipient.length === 0)) {
    throw new Error(`${fieldName} contains empty email address`);
  }
  return normalized;
}

export async function renderEmailTemplate(input: SendEmailInput): Promise<string> {
  const templatePath = resolve(process.cwd(), 'server/email/template.ejs');
  const templateSource = await fs.readFile(templatePath, 'utf8');

  return ejs.render(templateSource, {
    subject: input.subject.trim(),
    body: input.body.trim(),
    contentType: input.contentType ?? 'text',
    meta: {
      myCallsign: selfInfo.callsign,
      myEmail: selfInfo.email,
    }
  });
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const config = parseEmailConfig(emailConfig);
  const transportConfig: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.account,
      pass: config.password,
    },
  };

  const transporter = nodemailer.createTransport(transportConfig);

  const cc = normalizeRecipients(input.cc ?? [], 'cc');
  const bcc = normalizeRecipients(input.bcc ?? [], 'bcc');
  const contentType = input.contentType ?? 'text';
  const body = input.body.trim();
  const htmlBody = await renderEmailTemplate(input);

  await transporter.sendMail({
    from: config.from,
    to: normalizeRecipients(input.to, 'to').join(', '),
    cc: cc.join(', '),
    bcc: bcc.join(', '),
    subject: input.subject,
    text: contentType === 'text' ? body : undefined,
    html: htmlBody,
  });
}

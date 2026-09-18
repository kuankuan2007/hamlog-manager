import {
  email as emailValues,
  qrzCookie as qrzCookieValue,
  selfInfo as selfInfoValues,
} from './values';

export interface SelfInfoAddressConfig {
  postalCode: string;
  address: string;
  recipientName: string;
}

export interface SelfInfoConfig {
  address: SelfInfoAddressConfig;
  callsign: string;
  email: string;
  emailAddresses?: Record<string, string>;
}

export interface SmtpConfig {
  email: string;
  password: string;
  host: string;
  port?: number;
  secure?: boolean;
  from?: string;
}

export interface AppConfig {
  selfInfo: SelfInfoConfig;
  qrzCookie: string;
  email: SmtpConfig;
}

export const selfInfo: SelfInfoConfig = selfInfoValues;

const qrzCookie: string = qrzCookieValue;

const email: SmtpConfig = emailValues;

const config: AppConfig = { selfInfo, qrzCookie, email };

export default config;

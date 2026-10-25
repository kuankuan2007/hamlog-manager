import {
  databasePath as databasePathValue,
  publicDatabasePath as publicDatabasePathValue,
  email as emailValues,
  qrzCookie as qrzCookieValue,
  selfInfo as selfInfoValues,
  defaultValue as defaultValueValues,
} from './values';

export interface SelfInfoAddressConfig {
  postalCode: string;
  address: string;
  recipientName: string;
}

export interface SelfInfoConfig {
  address: SelfInfoAddressConfig;
  callsign: string;
  communicationProofIssuer: string;
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
  fromName?: string;
}

export interface DefaultValueConfig {
  newLog: {
    frequency: number;
    mode: 'FM' | 'AM' | 'CW';
  };
  sendEmail: {
    cc: string[];
    bcc: string[];
  };
}

export interface AppConfig {
  databasePath: string;
  publicDatabasePath: string;
  selfInfo: SelfInfoConfig;
  qrzCookie: string;
  email: SmtpConfig;
  defaultValue: DefaultValueConfig;
}

const databasePath: string = databasePathValue;
const publicDatabasePath: string = publicDatabasePathValue;

export const selfInfo: SelfInfoConfig = selfInfoValues;

const qrzCookie: string = qrzCookieValue;

const email: SmtpConfig = emailValues;

export const defaultValue: DefaultValueConfig = defaultValueValues;

const config: AppConfig = { databasePath, publicDatabasePath, selfInfo, qrzCookie, email, defaultValue };

export default config;

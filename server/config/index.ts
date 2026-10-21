import config from '@config';

export const databasePath = config.databasePath;
export const publicDatabasePath = config.publicDatabasePath;
export const selfInfo = config.selfInfo;
export const qrzCookie = config.qrzCookie;
export const emailConfig = config.email;

export type { AppConfig, SelfInfoAddressConfig, SelfInfoConfig, SmtpConfig } from '@config';

export default config;

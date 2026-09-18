import config from '@config';

export const selfInfo = config.selfInfo;
export const qrzCookie = config.qrzCookie;
export const emailConfig = config.email;

export type { AppConfig, SelfInfoAddressConfig, SelfInfoConfig, SmtpConfig } from '@config';

export default config;

import { selfInfo } from './index';

export const myCallsign = selfInfo.callsign;

export function isWrappedCallsign(callsign: string): boolean {
  return callsign.startsWith('<') && callsign.endsWith('>') && callsign.length > 2;
}

function configuredEmailAddresses(): Record<string, string> {
  return selfInfo.emailAddresses ?? {};
}

export function selectConfiguredEmailByCallsign(callsign: string): string | null {
  if (!isWrappedCallsign(callsign)) return null;
  const key = callsign.slice(1, -1).toUpperCase();
  for (const [configuredKey, configuredEmail] of Object.entries(configuredEmailAddresses())) {
    if (configuredKey.toUpperCase() !== key) continue;
    const email = configuredEmail.trim();
    if (email) return email;
  }
  return null;
}

export function selectConfiguredCallsignByEmail(email: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;
  for (const [configuredKey, configuredEmail] of Object.entries(configuredEmailAddresses())) {
    if (configuredEmail.trim().toLowerCase() !== normalizedEmail) continue;
    return `<${configuredKey.toUpperCase()}>`;
  }
  return null;
}

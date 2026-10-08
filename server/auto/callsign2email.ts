import { qrzCookie } from '@server/config';
import { createLogger } from '@server/log';

const autoLogger = createLogger('auto');
const emailLogger = autoLogger.createLogger('email');

async function getPage(callsign: string, cookie: string): Promise<string> {
  const response = await fetch(`https://www.qrz.com/db/${callsign}`, {
    method: 'GET',
    headers: {
      Cookie: cookie,
    },
  });
  return await response.text();
}

// from qrz.com source code
function showqem(cem: string): string {
  let cl = new String('');
  let dem = new String('');
  let i;
  for (i = cem.length - 1; i > 0; i--) {
    const c = cem.charAt(i);
    if (c != '!') {
      cl = cl.concat(c);
    } else {
      break;
    }
  }
  i--;
  for (let x = 0; x < Number(cl); x++) {
    dem = dem.concat(cem.charAt(i));
    i -= 2;
  }
  return String(dem);
}
export enum EmailError {
  LoginExpired = 1,
  NoEmailFound = 2,
}

export type Callsign2EmailResult =
  | { ok: true; email: string }
  | { ok: false; reason: EmailError };

export async function callsign2email(callsign: string): Promise<Callsign2EmailResult> {
  emailLogger.debug(`Fetching email for callsign: ${callsign}`);
  const page = await getPage(callsign, qrzCookie.trim());
  emailLogger.debug(`The page for callsign ${callsign} is fetched`);
  const qmailMatch = page.match(/\s*var\s+qmail\s*=\s*'([^']+)'/);
  if (!qmailMatch) {
    emailLogger.debug(`No email found for callsign ${callsign}`);
    const loginRequired = page.match(
      /Email\s*:.+https:\/\/www.qrz.com\/login.+required\s*to\s*view/gims
    );
    if (loginRequired) {
      emailLogger.error('Qrz.com login session expired');
      return { ok: false, reason: EmailError.LoginExpired };
    }
    return { ok: false, reason: EmailError.NoEmailFound };
  }
  const email = showqem(qmailMatch[1]);
  if (!email) {
    emailLogger.debug(`Decoded empty email for callsign ${callsign}`);
    return { ok: false, reason: EmailError.NoEmailFound };
  }
  emailLogger.debug(`Email resolved for callsign ${callsign}`);
  return { ok: true, email };
}

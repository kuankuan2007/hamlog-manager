import { Router, Statue } from '@kuankuan/k-server';
import { normalizeCallsign } from '@server/database';
import { insertCallsignEmailCache } from '@server/database/callsign-email-cache';
import { formatManualEmailInputErrors, validateManualEmailInput } from '@server/schema';
import type { ManualEmailInput } from '@schema/email';
import { doneStatue, invalidInputStatue } from '../status';
import { getCurrentTimeTagString } from '@util/time';

export const manualEmailRouter = new Router({
  matcher: 'manual-email',
  name: 'manual-email',
  onRootMatch: async (req, _res, ctx) => {
    if (req.method !== 'POST') {
      ctx.statue = Statue.METHOD_NOT_ALLOWED;
      return;
    }

    const input = (await req.json()) as ManualEmailInput;
    if (!validateManualEmailInput(input)) {
      ctx.statue = invalidInputStatue(formatManualEmailInputErrors(validateManualEmailInput.errors));
      return;
    }

    const normalizedCallsign = normalizeCallsign(input.callsign);
    const email = input.email.trim();
    if (email.length === 0) {
      ctx.statue = invalidInputStatue('email is required');
      return;
    }

    await insertCallsignEmailCache({
      callsign: normalizedCallsign,
      email,
      updatedAt: getCurrentTimeTagString(),
      provider: 'manual',
    });

    ctx.statue = doneStatue();
  },
});

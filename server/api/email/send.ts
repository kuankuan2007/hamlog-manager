import { Router, Statue } from '@kuankuan/k-server';
import {
  doneStatue,
  emailSendFailedStatue,
  invalidInputStatue,
} from '@server/api/status';
import { sendEmail } from '@server/email/send';
import {
  formatSendEmailInputErrors,
  validateSendEmailInput,
  type SendEmailInput,
} from '@server/schema';

export const SendEmailRouter = new Router({
  matcher: 'send',
  name: 'send',
  onRootMatch: async (req, _res, ctx) => {
    if (req.method !== 'POST') {
      ctx.statue = Statue.METHOD_NOT_ALLOWED;
      return;
    }

    const rawInput = (await req.json()) as SendEmailInput;
    const input: SendEmailInput = {
      ...rawInput,
      cc: rawInput.cc ?? [],
      bcc: rawInput.bcc ?? [],
    };

    if (!validateSendEmailInput(input)) {
      ctx.statue = invalidInputStatue(formatSendEmailInputErrors(validateSendEmailInput.errors));
      return;
    }

    try {
      await sendEmail(input);
      ctx.statue = doneStatue();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'email send failed';
      ctx.statue = emailSendFailedStatue(message);
    }
  },
});

import { Router, Statue } from '@kuankuan/k-server';
import {
  doneStatue,
  invalidInputStatue,
} from '@server/api/status';
import { renderEmailTemplate } from '@server/email/send';
import {
  formatSendEmailInputErrors,
  validateSendEmailInput,
  type SendEmailInput,
} from '@server/schema';

export const PreviewEmailRouter = new Router({
  matcher: 'preview',
  name: 'preview',
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
      ctx.data = {
        html: await renderEmailTemplate(input),
      };
      ctx.statue = doneStatue();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'email preview failed';
      ctx.statue = new Statue(10003, message, false);
    }
  },
});

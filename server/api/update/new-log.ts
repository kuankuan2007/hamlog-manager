import { Router, Statue } from '@kuankuan/k-server';
import {
  formatCreateCommunicationLogInputErrors,
  validateCreateCommunicationLogInput,
} from '../../schema';
import type { CreateCommunicationLogInput } from '../../../schema/communicationLog';
import { insertCommunicationLog } from '@server/database/update';
import { doneStatue, invalidInputStatue } from '../status';

export const newLogRouter = new Router({
  matcher: 'new-log',
  name: 'new-log',
  onRootMatch: async (req, res, ctx) => {
    if (req.method !== 'POST') {
      ctx.statue = Statue.METHOD_NOT_ALLOWED;
      return;
    }
    const input = (await req.json()) as CreateCommunicationLogInput;
    if (!validateCreateCommunicationLogInput(input)) {
      ctx.statue = invalidInputStatue(
        formatCreateCommunicationLogInputErrors(validateCreateCommunicationLogInput.errors)
      );
      return;
    }
    await insertCommunicationLog(input);
    ctx.statue = doneStatue();
  },
});

import { Router } from '@kuankuan/k-server';
import { PreviewEmailRouter } from './preview';
import { SendEmailRouter } from './send';

export const EmailRouter = new Router({
  matcher: 'email',
  name: 'email',
});

EmailRouter.addRouter(PreviewEmailRouter);
EmailRouter.addRouter(SendEmailRouter);

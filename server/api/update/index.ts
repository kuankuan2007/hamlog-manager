import { Router } from '@kuankuan/k-server';
import { newLogRouter } from './new-log';

export const UpdateRouter = new Router({
  matcher: 'update',
  name: 'update',
});
UpdateRouter.addRouter(newLogRouter);

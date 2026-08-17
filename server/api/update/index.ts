import { Router } from '@kuankuan/k-server';
import { newAddressRouter } from './new-address';
import { newLogRouter } from './new-log';

export const UpdateRouter = new Router({
  matcher: 'update',
  name: 'update',
});
UpdateRouter.addRouter(newAddressRouter);
UpdateRouter.addRouter(newLogRouter);

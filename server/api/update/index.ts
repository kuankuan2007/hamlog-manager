import { Router } from '@kuankuan/k-server';
import { newAddressRouter } from './new-address';
import { newLogRouter } from './new-log';
import { confirmQSLSendRouter, newQSLReceiveRouter, newQSLSendRouter } from './new-qsl';

export const UpdateRouter = new Router({
  matcher: 'update',
  name: 'update',
});
UpdateRouter.addRouter(newAddressRouter);
UpdateRouter.addRouter(newLogRouter);
UpdateRouter.addRouter(newQSLSendRouter);
UpdateRouter.addRouter(newQSLReceiveRouter);
UpdateRouter.addRouter(confirmQSLSendRouter);

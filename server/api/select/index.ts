import Router from '@kuankuan/k-server';
import { SelectAddressByCallsignRouter, SelectAddressesRouter } from './address';
import {
  SelectCommunicationLogBasicsByCallsignRouter,
  SelectCommunicationLogsByCallsignRouter,
  SelectCommunicationLogsRouter,
} from './communicationLog';
import { SelectQSLReceivesByCallsignRouter, SelectQSLReceivesRouter } from './qslReceive';
import { SelectQSLSendsByCallsignRouter, SelectQSLSendsRouter } from './qslSend';

const SelectRouter = new Router({
  matcher: 'select',
  name: 'select',
});

SelectRouter.addRouter(SelectCommunicationLogsRouter);
SelectRouter.addRouter(SelectCommunicationLogsByCallsignRouter);
SelectRouter.addRouter(SelectCommunicationLogBasicsByCallsignRouter);
SelectRouter.addRouter(SelectAddressesRouter);
SelectRouter.addRouter(SelectAddressByCallsignRouter);
SelectRouter.addRouter(SelectQSLReceivesRouter);
SelectRouter.addRouter(SelectQSLReceivesByCallsignRouter);
SelectRouter.addRouter(SelectQSLSendsRouter);
SelectRouter.addRouter(SelectQSLSendsByCallsignRouter);

export default SelectRouter;

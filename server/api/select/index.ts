import Router from '@kuankuan/k-server';
import {
  SelectAddressByCallsignRouter,
  SelectAddressesByCallsignsRouter,
  SelectAddressesRouter,
} from './address';
import {
	SearchCommunicationLogBasicsRouter,
  SelectCommunicationLogBasicsByCallsignRouter,
  SelectCommunicationLogsByCallsignRouter,
  SelectCommunicationLogsRouter,
} from './communicationLog';
import {
  SelectQSLReceivesByCallsignRouter,
  SelectQSLReceivesByCallsignsRouter,
  SelectQSLReceivesRouter,
} from './qslReceive';
import {
  SelectQSLSendsByCallsignRouter,
  SelectQSLSendsByCallsignsRouter,
  SelectQSLSendsRouter,
} from './qslSend';

export const SelectRouter = new Router({
  matcher: 'select',
  name: 'select',
});

SelectRouter.addRouter(SelectCommunicationLogsRouter);
SelectRouter.addRouter(SelectCommunicationLogsByCallsignRouter);
SelectRouter.addRouter(SelectCommunicationLogBasicsByCallsignRouter);
SelectRouter.addRouter(SearchCommunicationLogBasicsRouter);
SelectRouter.addRouter(SelectAddressesRouter);
SelectRouter.addRouter(SelectAddressesByCallsignsRouter);
SelectRouter.addRouter(SelectAddressByCallsignRouter);
SelectRouter.addRouter(SelectQSLReceivesRouter);
SelectRouter.addRouter(SelectQSLReceivesByCallsignsRouter);
SelectRouter.addRouter(SelectQSLReceivesByCallsignRouter);
SelectRouter.addRouter(SelectQSLSendsRouter);
SelectRouter.addRouter(SelectQSLSendsByCallsignsRouter);
SelectRouter.addRouter(SelectQSLSendsByCallsignRouter);


import Router from '@kuankuan/k-server';
import {
  SelectAddressByCallsignRouter,
  SelectAddressesByCallsignsRouter,
  SelectAddressesRouter,
} from './address';
import { SelectCallsignDetailRouter } from './callsignDetail';
import {
	SearchCommunicationLogBasicsRouter,
  SelectCommunicationLogBasicsByCallsignRouter,
  SelectCommunicationLogsByCallsignRouter,
  SelectCommunicationLogsRouter,
} from './communicationLog';
import {
  SelectQSLReceiveByIdRouter,
  SelectQSLReceivesByCallsignRouter,
  SelectQSLReceivesByCallsignsRouter,
  SelectQSLReceivesRouter,
} from './qslReceive';
import {
  SelectQSLSendByIdRouter,
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
SelectRouter.addRouter(SelectCallsignDetailRouter);
SelectRouter.addRouter(SelectAddressesRouter);
SelectRouter.addRouter(SelectAddressesByCallsignsRouter);
SelectRouter.addRouter(SelectAddressByCallsignRouter);
SelectRouter.addRouter(SelectQSLReceivesRouter);
SelectRouter.addRouter(SelectQSLReceivesByCallsignsRouter);
SelectRouter.addRouter(SelectQSLReceiveByIdRouter);
SelectRouter.addRouter(SelectQSLReceivesByCallsignRouter);
SelectRouter.addRouter(SelectQSLSendsRouter);
SelectRouter.addRouter(SelectQSLSendsByCallsignsRouter);
SelectRouter.addRouter(SelectQSLSendByIdRouter);
SelectRouter.addRouter(SelectQSLSendsByCallsignRouter);


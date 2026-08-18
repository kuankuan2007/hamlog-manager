import Router from "@kuankuan/k-server";

export const AutoRouter = new Router({
  matcher: 'auto',
  name: 'auto',
});

import { Callsign2EmailRouter } from './callsign2email';
AutoRouter.addRouter(Callsign2EmailRouter);

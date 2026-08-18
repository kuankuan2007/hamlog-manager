import { Router } from "@kuankuan/k-server";
import { SelectRouter } from "./select";
import { UpdateRouter } from "./update";
import { AutoRouter } from "./auto";

const ApiRouter = new Router({
  matcher: "api",
  name: "api",
});

ApiRouter.addRouter(SelectRouter);
ApiRouter.addRouter(UpdateRouter);
ApiRouter.addRouter(AutoRouter);
export default ApiRouter;

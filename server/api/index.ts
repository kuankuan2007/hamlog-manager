import { Router } from "@kuankuan/k-server";
import { SelectRouter } from "./select";
import { UpdateRouter } from "./update";

const ApiRouter = new Router({
  matcher: "api",
  name: "api",
});

ApiRouter.addRouter(SelectRouter);
ApiRouter.addRouter(UpdateRouter);
export default ApiRouter;

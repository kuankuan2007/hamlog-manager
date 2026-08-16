import Router from "@kuankuan/k-server";
import SelectRouter from "./select";

const ApiRouter = new Router({
  matcher: "api",
  name: "api",
});

ApiRouter.addRouter(SelectRouter);
export default ApiRouter;

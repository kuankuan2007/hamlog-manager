import { createServer } from '@kuankuan/k-server';
import { ConsoleRecorder, Level } from '@kuankuan/log-control';
import ApiRouter from './api';
const server = createServer();
server.routers.main.addRouter(ApiRouter);
server.logApplication.addRecorder(new ConsoleRecorder({startLevel: Level.Info}));
server.server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

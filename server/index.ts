import { createServer } from '@kuankuan/k-server';
import ApiRouter from './api';
const server = createServer();
server.routers.main.addRouter(ApiRouter);
server.server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

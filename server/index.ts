import { createServer } from '@kuankuan/k-server';
import { ConsoleRecorder, Level } from '@kuankuan/log-control';
import { parseArgs } from 'node:util';
import ApiRouter from './api';
import { maintainCommunicationLogSequenceNumbers } from './database/maintain';

const server = createServer();
server.routers.main.addRouter(ApiRouter);
server.logApplication.addRecorder(new ConsoleRecorder({startLevel: Level.Info}));

async function startServer(): Promise<void> {
  const { values } = parseArgs({
    options: {
      'maintain-sequence-numbers': { type: 'boolean', default: false },
    },
  });

  if (values['maintain-sequence-numbers']) {
    const repairedSequenceNumbers = await maintainCommunicationLogSequenceNumbers();
    console.log(
      `Communication log sequence number maintenance completed; repaired ${repairedSequenceNumbers} rows`,
    );
  }

  server.server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
}

startServer().catch((error: unknown) => {
  console.error('Unable to start server', error);
  process.exitCode = 1;
});

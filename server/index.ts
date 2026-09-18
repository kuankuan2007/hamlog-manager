import { createServer } from '@kuankuan/k-server';
import { ConsoleRecorder, Level } from '@kuankuan/log-control';
import { parseArgs } from 'node:util';
import ApiRouter from './api';
import { checkpointDatabase, ready } from './database';
import {
  maintainCommunicationLogForeignKeys,
  maintainCommunicationLogSequenceNumbers,
} from './database/maintain';

const server = createServer();
server.routers.main.addRouter(ApiRouter);
server.logApplication.addRecorder(new ConsoleRecorder({ startLevel: Level.Info }));

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid --port value: ${value}`);
  }
  return port;
}

async function startServer(): Promise<void> {
  const launchLogger = server.logApplication.createLogger('launch');
  launchLogger.info('Server is starting...');

  const { values } = parseArgs({
    options: {
      fix: { type: 'boolean', default: false },
      'maintain-sequence-numbers': { type: 'boolean', default: false },
      'no-checkpoint': { type: 'boolean', default: false },
      host: { type: 'string' },
      port: { type: 'string' },
    },
  });

  launchLogger.info(`Arguments parsed: ${JSON.stringify(values)}`);

  const host = values.host?.trim() || undefined;
  const port = values.port === undefined ? 3000 : parsePort(values.port);

  await ready;

  launchLogger.info('Database is ready');

  if (!values['no-checkpoint']) {
    launchLogger.debug('Checkpointing database...');
    await checkpointDatabase();
  }

  if (values.fix) {
    launchLogger.info('Fixing communication log foreign keys...');
    const repairedForeignKeys = await maintainCommunicationLogForeignKeys();
    console.log(
      `Communication log foreign key maintenance completed; repaired ${repairedForeignKeys} rows`,
    );
    launchLogger.info('Foreign key maintenance completed');
  }

  if (values['maintain-sequence-numbers']) {
    launchLogger.info('Maintaining communication log sequence numbers...');
    const repairedSequenceNumbers = await maintainCommunicationLogSequenceNumbers();
    console.log(
      `Communication log sequence number maintenance completed; repaired ${repairedSequenceNumbers} rows`,
    );
    launchLogger.info('Sequence number maintenance completed');
  }

  if (!values['no-checkpoint']) {
    launchLogger.debug('Checkpointing database...');
    await checkpointDatabase();
  }

  const onListening = () => {
    launchLogger.info(`Server is running on http://${host ?? 'localhost'}:${port}`);
  };
  if (host === undefined) {
    server.server.listen(port, onListening);
  } else {
    server.server.listen(port, host, onListening);
  }
}

startServer().catch((error: unknown) => {
  console.error('Unable to start server', error);
  process.exitCode = 1;
});

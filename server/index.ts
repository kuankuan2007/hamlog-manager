import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';
import ApiRouter from './api';
import {
  checkpointDatabase,
  checkpointPublicDatabase,
  closeDatabase,
  databasePath,
  publicDatabasePath,
  initializeDatabase,
  initializePublicDatabase,
} from './database';
import { createInitialDatabase } from './database/init';
import { migrateLegacyPublicData } from './database/migrate-public-data';
import {
  maintainCommunicationLogForeignKeys,
  maintainCommunicationLogSequenceNumbers,
} from './database/maintain';

import { server } from './create';
import { createLogger } from './log';

server.routers.main.addRouter(ApiRouter);


function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid --port value: ${value}`);
  }
  return port;
}

async function startServer(): Promise<void> {
  const launchLogger = createLogger('launch');
  launchLogger.info('Server is starting...');

  const { values } = parseArgs({
    options: {
      fix: { type: 'boolean', default: false },
      init: { type: 'boolean', default: false },
      'migrate-public-data': { type: 'boolean', default: false },
      'overwrite-public-data': { type: 'boolean', default: false },
      'maintain-sequence-numbers': { type: 'boolean', default: false },
      'no-checkpoint': { type: 'boolean', default: false },
      host: { type: 'string' },
      port: { type: 'string' },
    },
  });

  launchLogger.info(`Arguments parsed: ${JSON.stringify(values)}`);

  if (values['overwrite-public-data'] && !values['migrate-public-data']) {
    throw new Error('--overwrite-public-data requires --migrate-public-data');
  }
  if (values.init && values['migrate-public-data']) {
    throw new Error('--init cannot be combined with --migrate-public-data');
  }

  const host = values.host?.trim() || undefined;
  const port = values.port === undefined ? 3000 : parsePort(values.port);

  const personalDatabaseExists = existsSync(databasePath);
  const publicDatabaseExists = existsSync(publicDatabasePath);
  const missingDatabasePaths: string[] = [];

  if (!personalDatabaseExists && !values.init) {
    launchLogger.fatal(`Personal database is missing: ${databasePath}`);
    launchLogger.warn('Create the personal database with --init before starting the server.');
    missingDatabasePaths.push(databasePath);
  }

  const initializingFreshDatabase = values.init && !personalDatabaseExists;
  if (
    !publicDatabaseExists &&
    !initializingFreshDatabase &&
    !values['migrate-public-data']
  ) {
    launchLogger.fatal(`Public database is missing: ${publicDatabasePath}`);
    launchLogger.warn(
      'If the personal database contains legacy address or email data, run --migrate-public-data to create the public database and migrate it.',
    );
    missingDatabasePaths.push(publicDatabasePath);
  }

  if (missingDatabasePaths.length > 0) {
    throw new Error(`Required database file(s) are missing: ${missingDatabasePaths.join(', ')}`);
  }

  try {
    await initializePublicDatabase();

    if (values.init) {
      if (existsSync(databasePath)) {
        launchLogger.warn(
          `Database file ${databasePath} already exists; ignoring --init`,
        );
      } else {
        launchLogger.info('Creating initial database file...');
        await createInitialDatabase();
        launchLogger.info('Initial database file created');
      }
    }

    await initializeDatabase();

    launchLogger.info('Database is ready');

    if (values['migrate-public-data'] || !values['no-checkpoint']) {
      launchLogger.debug('Checkpointing database...');
      await checkpointDatabase();
      await checkpointPublicDatabase();
    }

    if (values['migrate-public-data']) {
      const migration = await migrateLegacyPublicData(
        values['overwrite-public-data'],
        (message) => launchLogger.warn(message),
      );
      launchLogger.info(
          `Public-data migration complete: addresses migrated=${migration.addresses.inserted + migration.addresses.overwritten}, inserted=${migration.addresses.inserted}, duplicates=${migration.addresses.duplicates}, conflictsSkipped=${migration.addresses.conflictsSkipped}, overwritten=${migration.addresses.overwritten}; emails migrated=${migration.emails.inserted + migration.emails.overwritten}, inserted=${migration.emails.inserted}, duplicates=${migration.emails.duplicates}, conflictsSkipped=${migration.emails.conflictsSkipped}, overwritten=${migration.emails.overwritten}`,
      );
      await closeDatabase();
      return;
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
      await checkpointPublicDatabase();
    }
  } catch (error) {
    launchLogger.fatal(
      `Database startup failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    );
    launchLogger.warn(
        `Before repairing either database, make a verified backup of the personal database and the public database, including any -wal/-shm files; do not delete existing database files to run --init`,
    );
    await closeDatabase();
    throw error;
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

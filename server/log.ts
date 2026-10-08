import { server } from '@server/create';
import { ConsoleRecorder, Level } from '@kuankuan/log-control';

server.logApplication.addRecorder(new ConsoleRecorder({ startLevel: Level.Info }));

export function createLogger(name: string) {
  return server.logApplication.createLogger(name);
}

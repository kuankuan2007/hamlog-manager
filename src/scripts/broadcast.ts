import { EventCenter } from './eventCenter';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomString(
  length: number,
  charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
): string {
  return Array.from({ length: length }, () => charset[randomInt(0, charset.length - 1)]).join('');
}

const CLIENT_ID = randomString(16);

type BroadcastEventMap = {
  ping: { clientId: string };
  pong: { clientId: string };
  update:
    | {
        type: 'log';
        id: number;
        callsign: string;
      }
    | {
        type: 'email';
        callsign: string;
        email: string;
      }
    | {
        type: 'address';
        callsign: string;
      }
    | {
        type: 'qsl-send';
        id: number;
        callsign: string;
      }
    | {
        type: 'qsl-receive';
        id: number;
        callsign: string;
      };
};

class BroadcastEventCenter<T extends BroadcastEventMap = BroadcastEventMap> extends EventCenter<T> {
  protected broadcastChannel: BroadcastChannel | undefined = void 0;
  protected clientId: string;
  constructor(public readonly broadcastChannelName: string) {
    super();
    this.clientId = CLIENT_ID;
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }
    const channel = new BroadcastChannel(broadcastChannelName);
    channel.onmessage = (event) => {
      const { eventName, data } = event.data;
      this.innerEmit(eventName, data);
    };
    this.broadcastChannel = channel;
    this.on('ping', () => {
      this.emit('pong', { clientId: this.clientId });
    });
  }
  public override emit<E extends keyof T>(eventName: E, data: T[E]): void {
    this.innerEmit(eventName, data);
    this.broadcastChannelMessage(eventName, data);
  }
  public onUpdate(callback: (data: T['update']) => void): () => void {
    return this.on('update', (eventName, data) => {
      void eventName;
      callback(data);
    });
  }
  protected broadcastChannelMessage<E extends keyof T>(eventName: E, data: T[E]): void {
    this.broadcastChannel?.postMessage({ eventName, data });
  }
  protected innerEmit<E extends keyof T>(eventName: E, data: T[E]): void {
    super.emit(eventName, data);
  }
}
export const broadcastEventCenter = new BroadcastEventCenter('hamlog-manager-default');

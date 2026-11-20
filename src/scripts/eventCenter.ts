type EventCallback<E, T> = (eventName: E, data: T) => void;

class EventCenter<T extends { [key: string]: unknown } = Record<string, unknown>> {
  protected events: {
    [key in keyof T]?: EventCallback<key, T[key]>[];
  } = {};

  public on<E extends keyof T>(eventName: E, callback: EventCallback<E, T[E]>): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return () => {
      this.off(eventName, callback);
    };
  }

  public emit<E extends keyof T>(eventName: E, data: T[E]): void {
    if (this.events[eventName]) {
      this.events[eventName].forEach((callback) => callback(eventName, data));
      return;
    }
  }

  public off<E extends keyof T>(eventName: E, callback: EventCallback<E, T[E]>): void {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName]!.filter((cb) => cb !== callback);
      return;
    }
  }
}

export { EventCenter };

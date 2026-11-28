export type HashId = string | undefined;

export interface HashBehavior {
  sync(id: HashId, hash: string): void;
  revoke(id: string): void;
  destroy(): void;
}

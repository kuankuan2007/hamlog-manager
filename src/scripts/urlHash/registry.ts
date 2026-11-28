export interface HashOwner {
  readonly element: HTMLElement;
  sync(hash: string): void;
  revoke(): void;
}

const owners = new Map<string, HashOwner>();

export function claimHashId(id: string, owner: HashOwner): boolean {
  const previous = owners.get(id);
  if (previous === owner) return true;

  owners.set(id, owner);
  if (previous) {
    console.warn(`Duplicate URL hash ID: ${id}`, previous.element, owner.element);
    previous.revoke();
  }
  return owners.get(id) === owner;
}

export function releaseHashId(id: string, owner: HashOwner): void {
  if (owners.get(id) === owner) owners.delete(id);
}

export function syncHashId(id: string, hash: string): void {
  owners.get(id)?.sync(hash);
}

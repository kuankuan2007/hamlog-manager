import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const { vUrlHashActive, vUrlHashFocus } = await jiti.import('../index.ts');
const { installHashRouteSync } = await jiti.import('../routeSync.ts');
const { claimHashId, releaseHashId, syncHashId } = await jiti.import('../registry.ts');

const listeners = new Map();
const frames = new Map();
let nextFrame = 0;
globalThis.window = { location: { hash: '' } };
globalThis.document = {
  addEventListener(type, listener) {
    listeners.set(type, listener);
  },
  removeEventListener(type, listener) {
    if (listeners.get(type) === listener) listeners.delete(type);
  },
};
globalThis.requestAnimationFrame = (callback) => {
  const id = ++nextFrame;
  frames.set(id, callback);
  return id;
};
globalThis.cancelAnimationFrame = (id) => frames.delete(id);

class TestElement {
  constructor(focusable = false) {
    this.focusable = focusable;
    this.attributes = new Map();
    this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => this.classes.add(name)),
      remove: (...names) => names.forEach((name) => this.classes.delete(name)),
      contains: (name) => this.classes.has(name),
    };
    this.isConnected = true;
    this.focusCount = 0;
    this.scrollCount = 0;
    this.child = null;
  }

  get id() {
    return this.attributes.get('id') ?? '';
  }

  set id(value) {
    this.attributes.set('id', value);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  matches() {
    return this.focusable;
  }

  querySelector() {
    return this.child;
  }

  focus() {
    this.focusCount++;
  }

  scrollIntoView() {
    this.scrollCount++;
  }
}

function setHash(hash) {
  window.location.hash = hash;
}

function mount(directive, element, value) {
  directive.mounted(element, { value });
}

function update(directive, element, oldValue, value) {
  directive.updated(element, { value, oldValue });
}

function unmount(directive, element) {
  directive.beforeUnmount(element);
}

function routeSync() {
  let callback;
  let disposed = false;
  const dispose = installHashRouteSync({
    afterEach(handler) {
      callback = handler;
      return () => {
        disposed = true;
      };
    },
  });
  return {
    change(oldHash, newHash, failure) {
      setHash(newHash);
      callback({ hash: newHash }, { hash: oldHash }, failure);
    },
    dispose,
    get disposed() {
      return disposed;
    },
  };
}

test('active follows route changes and click does not reset its match', () => {
  const route = routeSync();
  const element = new TestElement();
  setHash('#active-test');
  mount(vUrlHashActive, element, 'active-test');
  assert.equal(element.classList.contains('url-hash-active'), true);
  listeners.get('click')();
  assert.equal(element.classList.contains('url-hash-active'), false);
  route.change('#active-test', '#active-test');
  assert.equal(element.classList.contains('url-hash-active'), false);
  route.change('#active-test', '#other');
  route.change('#other', '#active-test');
  assert.equal(element.classList.contains('url-hash-active'), true);
  unmount(vUrlHashActive, element);
  assert.equal(frames.size, 0);
  assert.equal(listeners.has('click'), false);
  route.dispose();
  assert.equal(route.disposed, true);
});

test('duplicate ownership revokes the old instance and survives its unmount', () => {
  const route = routeSync();
  const first = new TestElement(true);
  const second = new TestElement(true);
  first.id = 'duplicate-test';
  const warn = console.warn;
  let warnings = 0;
  console.warn = () => warnings++;
  try {
    setHash('#other');
    mount(vUrlHashFocus, first, 'duplicate-test');
    mount(vUrlHashFocus, second, 'duplicate-test');
    assert.equal(warnings, 1);
    assert.equal(first.id, '');
    assert.equal(second.id, 'duplicate-test');
    unmount(vUrlHashFocus, first);
    route.change('#other', '#duplicate-test');
    assert.equal(second.classList.contains('url-hash-focus'), true);
    assert.equal(first.classList.contains('url-hash-focus'), false);
    unmount(vUrlHashFocus, second);
  } finally {
    console.warn = warn;
    route.dispose();
  }
});

test('focus restores its original target id and cancels pending focus on unmount', async () => {
  const container = new TestElement();
  const first = new TestElement(true);
  const second = new TestElement(true);
  first.id = 'original';
  container.child = first;
  setHash('#focus-test');
  mount(vUrlHashFocus, container, 'focus-test');
  container.child = second;
  update(vUrlHashFocus, container, 'focus-test', 'next-test');
  assert.equal(first.id, 'original');
  assert.equal(second.id, 'next-test');
  setHash('#focus-test');
  update(vUrlHashFocus, container, 'next-test', 'focus-test');
  unmount(vUrlHashFocus, container);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(first.focusCount, 0);
  assert.equal(second.focusCount, 0);
});

test('failed navigation does not synchronize its target', () => {
  const route = routeSync();
  const element = new TestElement();
  setHash('#other');
  mount(vUrlHashActive, element, 'failure-test');
  route.change('#other', '#failure-test', new Error('cancelled'));
  assert.equal(element.classList.contains('url-hash-active'), false);
  unmount(vUrlHashActive, element);
  route.dispose();
});

test('a queued scroll does not run after the element changes id', () => {
  const element = new TestElement();
  setHash('#old-id');
  mount(vUrlHashActive, element, 'old-id');
  update(vUrlHashActive, element, 'old-id', 'new-id');
  for (const callback of frames.values()) callback();
  assert.equal(element.scrollCount, 0);
  unmount(vUrlHashActive, element);
});

test('a later reentrant claim keeps ownership', () => {
  const calls = [];
  const last = { element: {}, sync: () => calls.push('last'), revoke: () => {} };
  const first = { element: {}, sync: () => {}, revoke: () => claimHashId('reentrant-test', last) };
  const middle = { element: {}, sync: () => calls.push('middle'), revoke: () => {} };
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(claimHashId('reentrant-test', first), true);
    assert.equal(claimHashId('reentrant-test', middle), false);
    releaseHashId('reentrant-test', middle);
    syncHashId('reentrant-test', '#reentrant-test');
    assert.deepEqual(calls, ['last']);
    releaseHashId('reentrant-test', last);
  } finally {
    console.warn = warn;
  }
});

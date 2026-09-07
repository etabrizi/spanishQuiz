import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import { createRequire } from 'node:module';
import { transform } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');

test('offline status renders with production JSX settings', async () => {
  const component = await readFile(new URL('../src/OfflineStatus.jsx', import.meta.url), 'utf8');
  const { code } = await transform(component, {
    loader: 'jsx',
    format: 'cjs',
    define: { 'import.meta.env.PROD': 'true' },
  });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: createRequire(import.meta.url) });
  const html = renderToStaticMarkup(React.createElement(module.exports.default));
  assert.match(html, /Saving for offline use/);
  assert.match(html, /role="status"/);
});

function worker({ failInstall = false } = {}) {
  const handlers = {};
  const snapshots = new Map([
    ['spanish-quiz-offline-old', new Map()],
    ['another-app', new Map()],
  ]);
  let claimed = false;
  const key = (request) => new URL(typeof request === 'string' ? request : request.url, 'https://quiz.test').pathname;
  class Request {
    constructor(url) { this.url = new URL(url, 'https://quiz.test').href; }
  }
  vm.runInNewContext(source, {
    URL, Request,
    self: {
      location: { origin: 'https://quiz.test' },
      addEventListener: (type, handler) => { handlers[type] = handler; },
      clients: { claim: async () => { claimed = true; } },
    },
    caches: {
      keys: async () => [...snapshots.keys()],
      delete: async (name) => snapshots.delete(name),
      open: async (name) => {
        if (!snapshots.has(name)) snapshots.set(name, new Map());
        const cache = snapshots.get(name);
        return {
          addAll: async (requests) => {
            if (failInstall) throw new Error('Download interrupted');
            for (const request of requests) {
              cache.set(key(request), await readFile(new URL(`../dist${key(request)}`, import.meta.url), 'utf8'));
            }
          },
          match: async (request) => cache.get(key(request)),
        };
      },
    },
    fetch: async () => { throw new Error('Network is offline'); },
  });
  return {
    snapshots,
    get claimed() { return claimed; },
    lifecycle(type) {
      let promise;
      handlers[type]({ waitUntil(value) { promise = value; } });
      return promise;
    },
    request(path, mode = 'cors', method = 'GET') {
      let promise;
      handlers.fetch({
        request: { url: new URL(path, 'https://quiz.test').href, mode, method },
        respondWith(value) { promise = value; },
      });
      return promise;
    },
  };
}

test('production app and questions load with the network unavailable', async () => {
  const app = worker();
  await app.lifecycle('install');
  await app.lifecycle('activate');
  assert.equal(app.claimed, true);
  assert.match(await app.request('/', 'navigate'), /<html/);
  assert.match(await app.request('/?installed=true', 'navigate'), /<html/);
  assert.ok(JSON.parse(await app.request('/questions.json')).length > 1);
  for (const file of await readdir(new URL('../dist/assets', import.meta.url))) {
    assert.ok(await app.request(`/assets/${file}`));
  }
  assert.ok(await app.request('/card-background.jpg'));
  assert.ok(await app.request('/manifest.webmanifest'));
  assert.equal(app.snapshots.has('spanish-quiz-offline-old'), false);
  assert.equal(app.snapshots.has('another-app'), true);
});

test('incomplete download fails installation and preserves the previous cache', async () => {
  const app = worker({ failInstall: true });
  await assert.rejects(app.lifecycle('install'), /Download interrupted/);
  assert.equal(app.snapshots.has('spanish-quiz-offline-old'), true);
  assert.equal(app.claimed, false);
});

test('worker leaves external requests and writes alone', () => {
  const app = worker();
  assert.equal(app.request('https://example.com/image.jpg'), undefined);
  assert.equal(app.request('/questions.json', 'cors', 'POST'), undefined);
});

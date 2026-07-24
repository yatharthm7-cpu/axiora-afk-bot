const assert = require('assert');
const BotManager = require('../src/botManager');

const proxyConfig = {
  type: 'socks5',
  host: '127.0.0.1',
  port: 1080,
  username: 'proxy-user',
  password: 'proxy-pass'
};

const normalized = BotManager.normalizeProxyConfig(proxyConfig);
assert.strictEqual(normalized.type, 'socks5');
assert.strictEqual(normalized.host, '127.0.0.1');
assert.strictEqual(normalized.port, 1080);
assert.strictEqual(normalized.username, 'proxy-user');
assert.strictEqual(normalized.password, 'proxy-pass');

const chunk = {
  x: 0,
  z: 0,
  blocks: [
    { x: 0, y: 64, z: 0, name: 'minecraft:stone' },
    { x: 1, y: 64, z: 0, name: 'minecraft:grass' }
  ]
};
const rendered = BotManager.renderChunkPreview(chunk, 3);
assert.ok(rendered.includes('minecraft:stone'));
assert.ok(rendered.includes('minecraft:grass'));
console.log('tests passed');

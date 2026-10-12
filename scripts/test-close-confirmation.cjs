const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const register = require('../desktop-close-confirmation.cjs');
(async () => {
  const window = new EventEmitter();
  let resolveDialog, prompts = 0, closed = 0;
  const dialog = { showMessageBox: async (_window, options) => {
    assert.equal(options.defaultId, 0); assert.equal(options.cancelId, 0);
    prompts++; return new Promise(resolve => { resolveDialog = resolve; });
  }};
  window.close = () => { const event = { prevented: false, preventDefault() { this.prevented = true; } }; window.emit('close', event); if (!event.prevented) closed++; };
  register(window, dialog);
  window.close(); assert.equal(closed, 0); assert.equal(prompts, 1);
  window.close(); assert.equal(prompts, 1);
  resolveDialog({ response: 0 }); await new Promise(setImmediate);
  assert.equal(closed, 0);
  window.close(); assert.equal(prompts, 2);
  resolveDialog({ response: 1 }); await new Promise(setImmediate);
  assert.equal(closed, 1); assert.equal(prompts, 2);
  console.log('PASS: Native close is blocked until confirmation, repeated clicks are coalesced, Cancel preserves window, Close exits without prompting again.');
})().catch(e => { console.error(e); process.exitCode = 1; });

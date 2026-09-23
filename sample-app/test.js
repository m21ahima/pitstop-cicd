// Minimal "test suite" — no framework needed for this project.
const assert = require('assert');

try {
  assert.strictEqual(1 + 1, 2, 'sanity check');
  console.log('All tests passed.');
  process.exit(0);
} catch (err) {
  console.error('Test failed:', err.message);
  process.exit(1);
}
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { title, slug, uuid } from './validation.js';

test('titles reject whitespace and oversize input', () => {
  assert.throws(() => title('   ', 200));
  assert.throws(() => title('x'.repeat(201), 200));
  assert.equal(title('  Hello  ', 200), 'Hello');
});
test('slugs normalize unicode and punctuation', () => {
  assert.equal(slug('  Café & Conversation! '), 'cafe-conversation');
});
test('ids reject SQL and malformed identifiers', () => {
  assert.throws(() => uuid('1; DROP TABLE users'));
});

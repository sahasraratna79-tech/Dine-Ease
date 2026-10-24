import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { findUnavailableItems, isMenuItemAvailable, updateMenuAvailability } from './availability.js';

function fakeDatabase(seed) {
  const menu = new Map(seed.map(item => [item.id, { ...item }]));
  return {
    menu,
    async query(sql, [available, id]) {
      assert.match(sql, /UPDATE menu_items SET available/);
      const item = menu.get(id);
      if (!item) return { rowCount: 0, rows: [] };
      item.available = available;
      return { rowCount: 1, rows: [{ ...item }] };
    },
  };
}

test('A: worker marks a dish unavailable and customer menu cannot add it', async () => {
  const db = fakeDatabase([{ id: 'masala-dosa', name: 'Masala Dosa', available: true }]);
  await updateMenuAvailability(db, 'masala-dosa', false);
  const customerMenu = [...db.menu.values()];
  assert.equal(customerMenu[0].available, false);
  assert.deepEqual(findUnavailableItems([{ id: 'masala-dosa' }], customerMenu).map(x => x.id), ['masala-dosa']);
});

test('B: checkout identifies an unavailable dish already in the cart', () => {
  const cart = [{ id: 'paneer-tikka', name: 'Paneer Tikka' }];
  assert.deepEqual(findUnavailableItems(cart, [{ id: 'paneer-tikka', available: false }]), cart);
});

test('C: a re-enabled dish is orderable again', async () => {
  const db = fakeDatabase([{ id: 'idly', available: false }]);
  await updateMenuAvailability(db, 'idly', true);
  assert.equal(isMenuItemAvailable(db.menu.get('idly')), true);
  assert.deepEqual(findUnavailableItems([{ id: 'idly' }], [...db.menu.values()]), []);
});

test('D: order validation uses the current database row, not stale client state', async () => {
  const db = fakeDatabase([{ id: 'chicken-biryani', available: true }]);
  const staleCustomerCopy = { id: 'chicken-biryani', available: true };
  await updateMenuAvailability(db, 'chicken-biryani', false);
  assert.equal(staleCustomerCopy.available, true);
  assert.equal(isMenuItemAvailable(db.menu.get('chicken-biryani')), false);
  const server = await readFile(new URL('./server.js', import.meta.url), 'utf8');
  assert.match(server, /SELECT id,name,price,available FROM menu_items WHERE id = \$1 FOR UPDATE/);
  assert.match(server, /isMenuItemAvailable\(menuResult\.rows\[0\]\)/);
});

test('E: availability survives worker and customer menu rereads', async () => {
  const db = fakeDatabase([{ id: 'samosa', available: true }]);
  await updateMenuAvailability(db, 'samosa', false);
  const workerRefresh = db.menu.get('samosa');
  const customerRefresh = db.menu.get('samosa');
  assert.equal(workerRefresh.available, false);
  assert.equal(customerRefresh.available, false);
});


export async function updateMenuAvailability(pool, id, available) {
  if (typeof available !== 'boolean') {
    throw new TypeError('Availability must be true or false.');
  }
  return pool.query(
    'UPDATE menu_items SET available = $1 WHERE id = $2 RETURNING id,name,description,price,category,veg,available,emoji',
    [available, id]
  );
}

export function isMenuItemAvailable(item) {
  return Boolean(item && item.available === true);
}

export function findUnavailableItems(orderItems, menuItems) {
  const menuById = new Map(menuItems.map(item => [item.id, item]));
  return orderItems.filter(item => !isMenuItemAvailable(menuById.get(String(item.id))));
}


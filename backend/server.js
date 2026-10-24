import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { updateMenuAvailability, isMenuItemAvailable } from './availability.js';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT) || 10000;

const configuredFrontendOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const publicFrontendOrigins = new Set([
  ...configuredFrontendOrigins,
  'https://dine-ease-nine.vercel.app',
  'https://dine-ease-sahasra7.vercel.app',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !process.env.FRONTEND_URL || publicFrontendOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  }
}));
app.use(express.json({ limit: '1mb' }));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DATABASE_URL. Add your Render PostgreSQL connection string in Environment settings.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const seedItems = [
  ['idly','Idli Sambar','Steamed rice cakes with house sambar',80,'South Indian',true,'🥣'],
  ['masala-dosa','Masala Dosa','Crisp dosa with potato masala',150,'South Indian',true,'🥞'],
  ['plain-dosa','Ghee Roast Dosa','Golden dosa finished with ghee',140,'South Indian',true,'🥞'],
  ['uttapam','Onion Uttapam','Soft rice pancake with onion',130,'South Indian',true,'🫓'],
  ['paneer-tikka','Paneer Tikka','Charred paneer, mint chutney',240,'Starters',true,'🍢'],
  ['chicken-tikka','Chicken Tikka','Tandoor roasted chicken',290,'Starters',false,'🍗'],
  ['samosa','Punjabi Samosa','Spiced potato in crisp pastry',70,'Snacks',true,'🥟'],
  ['chole','Chole Bhature','Chickpea curry with bhature',190,'North Indian',true,'🍛'],
  ['butter-chicken','Butter Chicken','Creamy tomato curry',320,'Main Course',false,'🍲'],
  ['dal-makhani','Dal Makhani','Slow-cooked black lentils',230,'Main Course',true,'🍲'],
  ['veg-biryani','Veg Dum Biryani','Fragrant basmati and vegetables',210,'Main Course',true,'🍚'],
  ['chicken-biryani','Chicken Biryani','Dum-cooked chicken and basmati',270,'Main Course',false,'🍚'],
  ['mango-lassi','Mango Lassi','Chilled mango yoghurt',100,'Beverages',true,'🥭'],
  ['masala-chai','Masala Chai','Freshly brewed spiced tea',50,'Beverages',true,'☕'],
  ['gulab-jamun','Gulab Jamun','Warm milk dumplings, two pieces',90,'Desserts',true,'🍮'],
  ['brownie','Chocolate Brownie','Warm chocolate brownie',130,'Desserts',true,'🍫'],
  ['lime-soda','Nimbu Soda','Fresh lime, sweet or salted',70,'Beverages',true,'🍋']
];

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
      category TEXT NOT NULL,
      veg BOOLEAN NOT NULL DEFAULT TRUE,
      available BOOLEAN NOT NULL DEFAULT TRUE,
      emoji TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      table_number TEXT NOT NULL,
      items JSONB NOT NULL,
      total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
      status TEXT NOT NULL DEFAULT 'Pending Acceptance',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const item of seedItems) {
    await pool.query(
      `INSERT INTO menu_items (id,name,description,price,category,veg,available,emoji)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7)
       ON CONFLICT (id) DO NOTHING`,
      item
    );
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'Tabilo API', database: 'connected' });
  } catch (error) {
    console.error(error);
    res.status(503).json({ ok: false, database: 'unavailable' });
  }
});

app.get('/api/menu', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id,name,description,price,category,veg,available,emoji FROM menu_items ORDER BY category,name');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load menu.' });
  }
});

app.patch('/api/menu/:id/availability', async (req, res) => {
  const { available } = req.body ?? {};
  if (typeof available !== 'boolean') {
    return res.status(400).json({ error: 'Availability must be true or false.' });
  }
  try {
    const result = await updateMenuAvailability(pool, req.params.id, available);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Menu item not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update item availability.' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { table, items } = req.body ?? {};
  if (typeof table !== 'string' || !table.trim() || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Provide a table and at least one order item.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const normalizedItems = [];
    let total = 0;

    for (const item of items) {
      const id = String(item?.id ?? '');
      const qty = Number(item?.qty);
      if (!id || !Number.isInteger(qty) || qty < 1 || qty > 50) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Each item must have a valid id and quantity from 1 to 50.' });
      }

      const menuResult = await client.query(
        'SELECT id,name,price,available FROM menu_items WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (!isMenuItemAvailable(menuResult.rows[0])) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Menu item ${menuResult.rows[0]?.name || id} is currently unavailable. Remove it or choose another dish.` });
      }

      const menuItem = menuResult.rows[0];
      const price = Number(menuItem.price);
      total += price * qty;
      normalizedItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price,
        qty,
        note: String(item?.note ?? '').slice(0, 300)
      });
    }

    const result = await client.query(
      'INSERT INTO orders (table_number,items,total) VALUES ($1,$2,$3) RETURNING id,table_number,items,total,status,created_at',
      [table.trim().slice(0, 30), JSON.stringify(normalizedItems), total]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Could not save order.' });
  } finally {
    client.release();
  }
});

app.get('/api/orders', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id,table_number,items,total,status,created_at FROM orders ORDER BY created_at DESC LIMIT 200'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const allowed = ['Pending Acceptance','Accepted','Preparing','Ready for Serving','Served','Rejected','Cancelled'];
  const status = req.body?.status;
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid order status.' });
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id,table_number,items,total,status,created_at',
      [status, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update order.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  initializeDatabase()
    .then(() => console.log(`Tabilo API listening on 0.0.0.0:${port}`))
    .catch(error => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
});


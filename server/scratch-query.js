import { getPool } from './db.js'

async function test() {
  const pool = getPool()
  const res = await pool.query('SELECT * FROM inventory WHERE site_id ILIKE $1', ['SITE-002'])
  console.log('SITE-002 rows count:', res.rows.length)
  console.log('Rows:', res.rows)
  await pool.end()
}

test()

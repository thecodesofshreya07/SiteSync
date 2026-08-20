import { getPool, setCollection, getCollectionDirect } from './db.js'

async function run() {
  const pool = getPool()
  if (pool) {
    await pool.query('DELETE FROM alerts WHERE id = $1', ['ALT-9487'])
  }
  const alerts = await getCollectionDirect('alerts')
  const filtered = alerts.filter((a) => a.id !== 'ALT-9487')
  setCollection('alerts', filtered)
  console.log('✓ Successfully deleted duplicate alert ALT-9487 from PostgreSQL & local cache')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

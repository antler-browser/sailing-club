import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isRemote = process.argv.includes('--remote')
const csvPath = resolve(__dirname, 'equipment.csv')
const csv = readFileSync(csvPath, 'utf-8')

const lines = csv.trim().split('\n').slice(1) // skip header
const dbName = 'sailing-club-dev-db'
const flag = isRemote ? '--remote' : '--local'

for (const line of lines) {
  const [id, name, type, category, status, sortOrder] = line.split(',')
  const sql = `INSERT INTO equipment (id, name, type, category, status, sort_order) VALUES ('${id}', '${name}', '${type}', '${category}', '${status}', ${sortOrder}) ON CONFLICT(id) DO UPDATE SET name=excluded.name, type=excluded.type, category=excluded.category, status=excluded.status, sort_order=excluded.sort_order;`

  try {
    execSync(`pnpm wrangler d1 execute ${dbName} ${flag} --command "${sql}"`, {
      stdio: 'inherit',
      cwd: resolve(__dirname, '..'),
    })
  } catch (err) {
    console.error(`Failed to seed row: ${id}`)
    process.exit(1)
  }
}

console.log(`Seeded ${lines.length} equipment items (${flag})`)

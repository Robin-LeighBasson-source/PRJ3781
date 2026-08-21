import { crawlAll } from './run.js'
import { exportSnapshot } from './export.js'
import { closeDb } from '../db/index.js'

function parseArgs(argv) {
  const options = { offline: false, dryRun: false, skipExport: false }
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, '').split('=')
    if (key === 'provider') options.providerId = value
    else if (key === 'max-pages') options.maxPages = Number(value)
    else if (key === 'offline') options.offline = true
    else if (key === 'dry-run') options.dryRun = true
    else if (key === 'quiet') options.verbose = false
    else if (key === 'no-export') options.skipExport = true
    else if (key === 'help') options.help = true
  }
  return options
}

const HELP = `
Morrow certification crawler

  npm run crawl -- [options]

  --provider=<id>    crawl one provider (microsoft-learn | coursera)
  --max-pages=<n>    cap pages for paginated providers
  --offline          replay from the HTTP cache only, no network at all
  --dry-run          normalize and count without writing records
  --no-export        skip refreshing public/data/certifications.json
  --quiet            suppress per-request logging
  --help             show this message
`

const options = parseArgs(process.argv.slice(2))

if (options.help) {
  console.log(HELP)
  process.exit(0)
}

try {
  const summaries = await crawlAll(options)
  if (!options.dryRun && !options.skipExport) {
    await exportSnapshot()
  }
  const failed = summaries.some((summary) => summary.status === 'error')
  process.exitCode = failed ? 1 : 0
} catch (error) {
  console.error(`[crawl] fatal: ${error.message}`)
  process.exitCode = 1
} finally {
  closeDb()
}

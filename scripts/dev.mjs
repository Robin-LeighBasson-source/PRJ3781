// `npm run dev`: start Vite straight away, then refresh the crawled listings in the
// background (jobs, then hackathons, then courses). Each crawler saves to
// public/data/*.json as it goes, so refresh the page to see new listings.
// Run `npm run dev:web` to start Vite without crawling.
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const crawlers = [
  ['jobs', 'server/src/crawl/jobCrawler.js'],
  ['hackathons', 'server/src/crawl/hackathonCrawler.js'],
  ['courses', 'server/src/crawl/courseCrawler.js'],
]

// Extra arguments (e.g. `npm run dev -- --host 0.0.0.0` in Docker) go to Vite.
const vite = spawn(
  process.execPath,
  [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', ...process.argv.slice(2)],
  { cwd: root, stdio: 'inherit' },
)

let crawler = null

vite.on('exit', (code) => {
  crawler?.kill()
  process.exit(code ?? 0)
})

// The crawlers read their key from jobCrawler.env (or the environment).
function hasFirecrawlKey() {
  if (process.env.FIRECRAWL_API_KEY) return true
  try {
    const env = fs.readFileSync(path.join(root, 'jobCrawler.env'), 'utf8')
    return /^\s*FIRECRAWL_API_KEY\s*=\s*\S+/m.test(env)
  } catch {
    return false
  }
}

// Prefix each line so crawler output is easy to tell apart from Vite's.
function prefixLines(stream, target, label) {
  let pending = ''
  stream.on('data', (chunk) => {
    const lines = (pending + chunk).split(/\r?\n/)
    pending = lines.pop()
    for (const line of lines) target.write(`[crawl:${label}] ${line}\n`)
  })
  stream.on('end', () => {
    if (pending) target.write(`[crawl:${label}] ${pending}\n`)
  })
}

function runCrawler(label, script) {
  return new Promise((resolve) => {
    console.log(`[crawl:${label}] starting`)
    crawler = spawn(process.execPath, [path.join(root, script)], { cwd: root })
    prefixLines(crawler.stdout, process.stdout, label)
    prefixLines(crawler.stderr, process.stderr, label)
    crawler.on('error', (error) => {
      console.error(`[crawl:${label}] could not start: ${error.message}`)
      resolve()
    })
    crawler.on('exit', (code) => {
      crawler = null
      console.log(`[crawl:${label}] finished${code ? ` (exit code ${code})` : ''}`)
      resolve()
    })
  })
}

if (!hasFirecrawlKey()) {
  console.log('[crawl] skipped: no FIRECRAWL_API_KEY in jobCrawler.env')
} else {
  for (const [label, script] of crawlers) {
    await runCrawler(label, script)
  }
  console.log('[crawl] all crawlers finished - refresh the page to see the latest listings')
}

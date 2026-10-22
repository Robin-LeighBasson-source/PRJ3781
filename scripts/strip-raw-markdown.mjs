// One-off: remove the "rawMarkdown" field from the public data files to make
// them smaller. Only that field is removed; everything else is left as it is.
// Run with: node scripts/strip-raw-markdown.mjs
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const files = ['public/data/jobs.json', 'public/data/hackathons.json', 'public/data/courses.json']

for (const file of files) {
  const filePath = path.join(root, file)
  const text = await fs.readFile(filePath, 'utf8')
  const items = JSON.parse(text)

  if (!Array.isArray(items)) {
    console.log(`${file}: not an array, skipped`)
    continue
  }

  let removed = 0
  for (const item of items) {
    if (item && typeof item === 'object' && 'rawMarkdown' in item) {
      delete item.rawMarkdown
      removed++
    }
  }

  // Keep the file's existing indentation.
  const indent = text.match(/^\[\s*\n([ \t]+)/)?.[1] ?? 2
  await fs.writeFile(filePath, `${JSON.stringify(items, null, indent)}\n`)
  console.log(`${file}: removed rawMarkdown from ${removed} of ${items.length} items`)
}

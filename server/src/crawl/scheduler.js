import cron from 'node-cron'
import { config } from '../config.js'
import { crawlAll } from './run.js'
import { exportSnapshot } from './export.js'
import { isRunInProgress } from '../db/repository.js'

let running = false

async function tick() {
  // Two guards: an in-process flag, and a database check that also catches a run
  // left behind by a crashed process.
  if (running || isRunInProgress()) {
    console.warn('[schedule] previous crawl still in progress, skipping this window')
    return
  }

  // Jitter the start so we never hit providers at exactly the same second each day.
  const jitterMs = Math.random() * config.schedule.maxJitterMinutes * 60 * 1000
  console.log(`[schedule] crawl starting in ${Math.round(jitterMs / 1000)}s`)
  await new Promise((resolve) => setTimeout(resolve, jitterMs))

  running = true
  try {
    await crawlAll({ verbose: false })
    await exportSnapshot()
  } catch (error) {
    console.error(`[schedule] crawl failed: ${error.message}`)
  } finally {
    running = false
  }
}

export function startScheduler() {
  if (!config.schedule.enabled) {
    console.log('[schedule] disabled (MORROW_CRAWL_SCHEDULE_ENABLED=0)')
    return null
  }
  const task = cron.schedule(config.schedule.cron, tick, { timezone: config.schedule.timezone })
  console.log(`[schedule] crawl scheduled: "${config.schedule.cron}" ${config.schedule.timezone}`)
  return task
}

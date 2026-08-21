/**
 * Per-host rate limiting: a minimum interval between request starts plus a hard cap
 * on concurrent in-flight requests. Both are per-host, so a slow provider never
 * starves another, and no single host is ever hit faster than configured.
 */
export class HostLimiter {
  constructor({ minIntervalMs = 2000, maxConcurrent = 2 } = {}) {
    this.minIntervalMs = minIntervalMs
    this.maxConcurrent = maxConcurrent
    this.hosts = new Map()
  }

  #state(host) {
    if (!this.hosts.has(host)) {
      this.hosts.set(host, {
        active: 0,
        lastStartedAt: 0,
        queue: [],
        timer: null,
        minIntervalMs: this.minIntervalMs,
      })
    }
    return this.hosts.get(host)
  }

  /** Raise the interval for one host, e.g. to honour a robots.txt Crawl-delay. */
  setHostInterval(host, intervalMs) {
    const state = this.#state(host)
    state.minIntervalMs = Math.max(state.minIntervalMs, intervalMs)
  }

  /** Resolves with a release function once it is this caller's turn. */
  acquire(host) {
    return new Promise((resolve) => {
      this.#state(host).queue.push(resolve)
      this.#pump(host)
    })
  }

  #pump(host) {
    const state = this.#state(host)
    if (state.queue.length === 0 || state.active >= this.maxConcurrent) return

    const waited = Date.now() - state.lastStartedAt
    if (waited < state.minIntervalMs) {
      if (!state.timer) {
        state.timer = setTimeout(() => {
          state.timer = null
          this.#pump(host)
        }, state.minIntervalMs - waited)
      }
      return
    }

    const resolve = state.queue.shift()
    state.active += 1
    state.lastStartedAt = Date.now()

    let released = false
    resolve(() => {
      if (released) return
      released = true
      state.active -= 1
      this.#pump(host)
    })

    // Another slot may already be free when maxConcurrent > 1.
    this.#pump(host)
  }
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Exponential backoff with full jitter, so retries from parallel workers spread out. */
export function backoffDelay(attempt, baseMs = 1000, capMs = 30000) {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt)
  return Math.round(Math.random() * ceiling)
}

export const handleGetNowTime =
  typeof performance == 'object' && performance.now ? performance.now.bind(performance) : Date.now.bind(Date)

export const noop = () => {}

export const handleRequestAnimationFrame = (callback: FrameRequestCallback) => {
  if (globalThis.requestAnimationFrame) return globalThis.requestAnimationFrame(callback)

  globalThis.setTimeout(callback, 0)
  return null
}
export const handleCancelAnimationFrame = (id: number) => {
  if (globalThis.cancelAnimationFrame) return globalThis.cancelAnimationFrame(id)
}

export class TimeoutTools {
  private invokeTime: number = 0
  private animationFrameId: number | null = null
  private timeoutId: null | ReturnType<typeof globalThis.setTimeout> = null
  private callback: ((diff: number) => void) | null = null
  private thresholdTime: number = 200

  private run() {
    this.animationFrameId = handleRequestAnimationFrame(() => {
      this.animationFrameId = null
      let diff = this.invokeTime - handleGetNowTime()
      if (diff > 0) {
        if (diff < this.thresholdTime) {
          this.run()
          return
        }
        this.timeoutId = globalThis.setTimeout(() => {
          this.timeoutId = null
          this.run()
        }, diff - this.thresholdTime)
        return
      }

      this.callback && this.callback(diff)
    })
  }

  start(callback = noop, timeout = 0) {
    this.callback = callback
    this.invokeTime = handleGetNowTime() + timeout
    this.run()
  }

  clear() {
    if (this.animationFrameId) {
      handleCancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    if (this.timeoutId) {
      globalThis.clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.callback = null
  }
}

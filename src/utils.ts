export const handleGetNowTime =
  typeof performance == 'object' && performance.now ? performance.now.bind(performance) : Date.now.bind(Date)

export const noop = () => {}

export const handleRequestAnimationFrame = (callback: FrameRequestCallback) => {
  // @ts-expect-error
  if (globalThis.requestAnimationFrame) return requestAnimationFrame(callback)

  globalThis.setTimeout(callback, 0)
  return null
}
export const handleCancelAnimationFrame = (id: number) => {
  // @ts-expect-error
  if (globalThis.cancelAnimationFrame) return cancelAnimationFrame(id)
}

export class TimeoutTools {
  invokeTime = 0
  animationFrameId = null as number | null
  timeoutId = null as number | null
  callback = null as ((diffTime: number) => void) | null
  thresholdTime = 200

  run() {
    this.animationFrameId = handleRequestAnimationFrame(() => {
      this.animationFrameId = null
      let diff = this.invokeTime - handleGetNowTime()
      if (diff > 0) {
        if (diff < this.thresholdTime) {
          this.run()
          return
        }
        // @ts-expect-error
        return (this.timeoutId = globalThis.setTimeout(() => {
          this.timeoutId = null
          this.run()
        }, diff - this.thresholdTime))
      }

      this.callback!(diff)
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

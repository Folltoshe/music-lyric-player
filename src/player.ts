import { type LyricInfo, type LyricLine, type DynamicFontInfo, EMPTY_LYRIC_INFO } from './parser'
import { TimeoutTools, handleGetNowTime, noop } from './utils'

export interface DynamicFontElementRef {
  play: (duration: number) => void
  pause: () => void
  reset: () => void
}
export interface Options {
  /**
   * Listening lyric line play event
   * @param line line number of current play
   * @param info line info
   */
  onLinePlay?: (lineNum: number, info: LyricLine) => void

  /**
   * Listening lyric font play event
   * @param fontNum font number of current play
   * @param info font info
   */
  onFontPlay?: (fontNum: number, info: DynamicFontInfo) => void

  /**
   * listening lyrics seting event
   * @param lines array of all lyric text
   */
  onSetLyric?: (info: LyricInfo) => void

  /**
   * offset time(ms), default is 150 ms
   */
  offset?: number

  /**
   * playback rate, default is 1
   */
  playbackRate?: number

  /**
   * lyric info
   */
  lyricInfo?: LyricInfo
}
type NonNullableOptions = Required<Options>

export class LyricPlayer {
  private tools: {
    lineTimeout: TimeoutTools
    fontTimeout: TimeoutTools
    waitPlayTimeout: TimeoutTools
  }
  private events: {
    onLinePlay: NonNullableOptions['onLinePlay']
    onFontPlay: NonNullableOptions['onFontPlay']
    onSetLyric: NonNullableOptions['onSetLyric']
  }
  private config: {
    offset: NonNullableOptions['offset']
    playbackRate: NonNullableOptions['playbackRate']
  }

  private currentStatus: {
    playing: boolean
    startTime: number
    performanceTime: number
  }

  private currentLyricInfo: LyricInfo
  private currentLineInfo: {
    num: number
    max: number
  }
  private currentFontInfo: {
    fonts: DynamicFontInfo[]
    refs: Array<DynamicFontElementRef[]>
    num: number
    max: number
  }

  constructor({
    lyricInfo = EMPTY_LYRIC_INFO,
    offset = 150,
    playbackRate = 1,
    onLinePlay = noop,
    onFontPlay = noop,
    onSetLyric = noop,
  }: Options) {
    this.tools = {
      lineTimeout: new TimeoutTools(),
      fontTimeout: new TimeoutTools(),
      waitPlayTimeout: new TimeoutTools(),
    }
    this.config = { offset, playbackRate }
    this.events = { onLinePlay, onFontPlay, onSetLyric }

    this.currentStatus = {
      playing: false,
      performanceTime: 0,
      startTime: 0,
    }

    this.currentLyricInfo = lyricInfo
    this.currentLineInfo = {
      num: 0,
      max: 0,
    }
    this.currentFontInfo = {
      fonts: [],
      refs: [],
      num: 0,
      max: 0,
    }

    this.init()
  }

  private init() {
    this.events.onSetLyric(this.currentLyricInfo)
    this.currentLineInfo.max = this.currentLyricInfo.lyrics.length - 1
  }

  private handleGetCurrentTime() {
    return (
      (handleGetNowTime() - this.currentStatus.performanceTime) * this.config.playbackRate +
      this.currentStatus.startTime
    )
  }

  private handleGetFontRef(line: number, index: number) {
    const currentLine = this.currentFontInfo.refs[line]
    if (!currentLine) return null
    return currentLine[index]
  }
  private handleUpdateFontInfo() {
    this.currentFontInfo.fonts = this.currentLyricInfo.lyrics[this.currentLineInfo.num].content.dynamic?.words || []
    this.currentFontInfo.max = this.currentFontInfo.fonts.length - 1
    this.currentFontInfo.num = 0
  }

  private handleFindCurrentLine(time: number, start = 0) {
    if (time <= 0) return 0
    const length = this.currentLyricInfo.lyrics.length
    for (let index = start; index < length; index++) {
      if (time <= this.currentLyricInfo.lyrics[index].time) return index === 0 ? 0 : index - 1
    }
    return length - 1
  }
  private handleFindCurrentFont(time: number, start = 0) {
    const length = this.currentFontInfo.fonts.length
    for (let index = start; index < length; index++) {
      if (time < this.currentFontInfo.fonts[index].time) return index == 0 ? 0 : index - 1
    }
    return length - 1
  }

  private handlePlayMaxLine() {
    const currentLine = this.currentLyricInfo.lyrics[this.currentLineInfo.num]

    this.events.onLinePlay(this.currentLineInfo.num, currentLine)
    if (currentLine.duration > 0) {
      this.tools.lineTimeout.start(() => this.pause(), currentLine.duration)
      this.handleUpdateFontInfo()
      this.handleFontRefresh()
    } else this.pause()
  }
  private handlePlayMaxFont() {
    const currentFont = this.currentFontInfo.fonts[this.currentFontInfo.num]
    this.events.onFontPlay(this.currentFontInfo.num, currentFont)
    this.handleGetFontRef(this.currentLineInfo.num, this.currentFontInfo.num)?.play(currentFont.duration)
    this.handleFontPause()
  }

  private handleLineRefresh() {
    this.currentLineInfo.num++
    if (this.currentLineInfo.num >= this.currentLineInfo.max) {
      this.handlePlayMaxLine()
      return
    }

    const currentLine = this.currentLyricInfo.lyrics[this.currentLineInfo.num]
    const currentTime = this.handleGetCurrentTime()

    const driftTime = currentTime - currentLine.time

    if (driftTime >= 0 || this.currentLineInfo.num === 0) {
      const nextLine = this.currentLyricInfo.lyrics[this.currentLineInfo.num + 1]
      const delay = (nextLine.time - currentLine.time - driftTime) / this.config.playbackRate

      if (delay > 0) {
        if (this.currentStatus.playing) {
          this.tools.lineTimeout.start(() => {
            if (!this.currentStatus.playing) return
            this.handleLineRefresh()
          }, delay)
        }

        this.events.onLinePlay(this.currentLineInfo.num, currentLine)

        this.handleUpdateFontInfo()
        this.handleFontRefresh()
      } else {
        const newCurLineNum = this.handleFindCurrentLine(currentTime, this.currentLineInfo.num + 1)
        if (newCurLineNum > this.currentLineInfo.num) this.currentLineInfo.num = newCurLineNum - 1
        this.handleLineRefresh()
      }

      return
    }

    this.currentLineInfo.num = this.handleFindCurrentLine(currentTime, this.currentLineInfo.num) - 1
    this.handleLineRefresh()
  }
  private handleFontRefresh() {
    this.currentFontInfo.num++
    if (this.currentFontInfo.num >= this.currentFontInfo.max) {
      this.handlePlayMaxFont()
      return
    }

    const currentFont = this.currentFontInfo.fonts[this.currentFontInfo.num]
    const currentTime = this.handleGetCurrentTime()
    const driftTime = currentTime - currentFont.time

    if (driftTime >= 0 || this.currentFontInfo.num == 0) {
      const nextFont = this.currentFontInfo.fonts[this.currentFontInfo.num + 1]
      const delay = (nextFont.time - currentFont.time - driftTime) / this.config.playbackRate

      if (delay > 0) {
        if (this.currentStatus.playing) {
          this.tools.fontTimeout.start(() => {
            if (!this.currentStatus.playing) return
            this.handleFontRefresh()
          }, delay)
        }

        this.events.onFontPlay(this.currentFontInfo.num, currentFont)
        this.handleGetFontRef(this.currentLineInfo.num, this.currentFontInfo.num)?.play(currentFont.duration)
      } else {
        const newCurrentFont = this.handleFindCurrentFont(currentTime, this.currentFontInfo.num + 1)
        if (newCurrentFont > this.currentFontInfo.num) this.currentFontInfo.num = newCurrentFont - 1
        for (let i = 0; i <= this.currentFontInfo.num; i++) this.handleGetFontRef(this.currentLineInfo.num, i)?.play(0)
        this.handleFontRefresh()
      }

      return
    } else if (this.currentFontInfo.num == 0) {
      this.currentFontInfo.num--
      if (this.currentStatus.playing) {
        this.tools.waitPlayTimeout.start(() => {
          if (!this.currentStatus.playing) return
          this.handleFontRefresh()
        }, -driftTime)
      }

      return
    }

    this.currentFontInfo.num = this.handleFindCurrentFont(currentTime, this.currentFontInfo.num) - 1
    for (let i = 0; i <= this.currentFontInfo.num; i++) this.handleGetFontRef(this.currentLineInfo.num, i)?.play(0)
    this.handleFontRefresh()
  }

  private handleLinePause() {
    if (!this.currentStatus.playing) return
    this.currentStatus.playing = false
    this.tools.lineTimeout.clear()

    if (this.currentLineInfo.num === this.currentLineInfo.max) return

    const currentLineNum = this.handleFindCurrentLine(this.handleGetCurrentTime())
    if (this.currentLineInfo.num !== currentLineNum) {
      this.currentLineInfo.num = currentLineNum
      this.events.onLinePlay(currentLineNum, this.currentLyricInfo.lyrics[currentLineNum])
    }
  }
  private handleFontPause() {
    if (!this.currentStatus.playing) return

    this.tools.fontTimeout.clear()
    this.tools.waitPlayTimeout.clear()

    this.handleGetFontRef(this.currentLineInfo.num, this.currentFontInfo.num)?.pause()

    if (this.currentFontInfo.num === this.currentFontInfo.max) return
    const currentFontNum = this.handleFindCurrentFont(this.handleGetCurrentTime())
    if (this.currentFontInfo.num === currentFontNum) return
    for (let i = 0; i < this.currentFontInfo.num; i++) this.handleGetFontRef(this.currentLineInfo.num, i)?.play(0)
  }

  /**
   * Play lyric
   * @param currentTime play time, unit: ms
   */
  play(currentTime = 0) {
    if (!this.currentLyricInfo.lyrics.length) return

    this.pause()

    this.currentStatus.playing = true
    this.currentStatus.performanceTime = handleGetNowTime() - Math.trunc(this.config.offset)
    this.currentStatus.startTime = currentTime

    this.currentLineInfo.num = this.handleFindCurrentLine(this.handleGetCurrentTime()) - 1
    this.handleLineRefresh()
  }

  /**
   * Pause lyric
   */
  pause() {
    this.handleFontPause()
    this.handleLinePause()
  }

  /**
   * Set playback rate
   * @param playbackRate playback rate
   */
  setPlaybackRate(playbackRate: NonNullableOptions['playbackRate']) {
    this.config.playbackRate = playbackRate
    if (!this.currentLyricInfo.lyrics.length) return
    if (!this.currentStatus.playing) return
    this.play(this.handleGetCurrentTime())
  }

  /**
   * Set lyric
   * @param lyricInfo lyric info
   */
  setLyric(lyricInfo: LyricInfo) {
    if (this.currentStatus.playing) this.pause()
    this.currentLyricInfo = lyricInfo
    this.init()
  }

  setDynamicFontsRef(refs: typeof this.currentFontInfo.refs) {
    this.currentFontInfo.refs = refs
  }
}

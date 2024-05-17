import type { LyricInfo, LyricLine } from './parser'
import { TimeoutTools, handleGetNowTime, noop } from './utils'

export interface Options {
  /**
   * Listening play event
   * @param line line number of current play
   * @param info line info
   */
  onPlay?: (line: number, info: LyricLine) => void

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
   * has remove blank line, default is true
   */
  isRemoveBlankLine?: boolean

  /**
   * lyric file text
   */
  lyricInfo?: LyricInfo
}
type NonNullableOptions = Required<Options>

const timeoutTools = new TimeoutTools()

export class LyricPlayer {
  private lyricInfo: LyricInfo
  private lyricEvents: {
    onPlay: NonNullableOptions['onPlay']
    onSetLyric: NonNullableOptions['onSetLyric']
  }
  private lyricConfig: {
    offset: NonNullableOptions['offset']
    playbackRate: NonNullableOptions['playbackRate']
    isRemoveBlankLine: NonNullableOptions['isRemoveBlankLine']
  }
  private currentInfo: {
    playing: boolean
    lineNum: number
    maxLineNum: number
    startTime: number
    performanceTime: number
  }

  constructor({
    lyricInfo = { scroll: false, lyrics: [] },
    offset = 150,
    playbackRate = 1,
    onPlay = noop,
    onSetLyric = noop,
    isRemoveBlankLine = true,
  }: Options) {
    this.lyricInfo = lyricInfo

    this.lyricConfig = {
      offset,
      isRemoveBlankLine,
      playbackRate,
    }

    this.lyricEvents = {
      onPlay,
      onSetLyric,
    }

    this.currentInfo = {
      playing: false,
      lineNum: 0,
      maxLineNum: 0,
      performanceTime: 0,
      startTime: 0,
    }

    this.init()
  }

  private init() {
    this.lyricEvents.onSetLyric(this.lyricInfo)
    this.currentInfo.maxLineNum = this.lyricInfo.lyrics.length - 1
  }

  private handleGetCurrentTime() {
    return (
      (handleGetNowTime() - this.currentInfo.performanceTime) * this.lyricConfig.playbackRate +
      this.currentInfo.startTime
    )
  }

  private handleFindCurrentLineNum(time: number, startIndex = 0) {
    if (time <= 0) return 0
    const length = this.lyricInfo.lyrics.length
    for (let index = startIndex; index < length; index++)
      if (time <= this.lyricInfo.lyrics[index].time) return index === 0 ? 0 : index - 1
    return length - 1
  }

  private handlePlayMaxLine() {
    this.lyricEvents.onPlay(this.currentInfo.lineNum, this.lyricInfo.lyrics[this.currentInfo.lineNum])
    this.pause()
  }

  private refresh() {
    this.currentInfo.lineNum++
    if (this.currentInfo.lineNum >= this.currentInfo.maxLineNum) {
      this.handlePlayMaxLine()
      return
    }

    const currentLine = this.lyricInfo.lyrics[this.currentInfo.lineNum]
    const currentTime = this.handleGetCurrentTime()

    const driftTime = currentTime - currentLine.time

    if (driftTime >= 0 || this.currentInfo.lineNum === 0) {
      let nextLine = this.lyricInfo.lyrics[this.currentInfo.lineNum + 1]
      const delay = (nextLine.time - currentLine.time - driftTime) / this.lyricConfig.playbackRate

      if (delay > 0) {
        if (this.currentInfo.playing) {
          timeoutTools.start(() => {
            if (!this.currentInfo.playing) return
            this.refresh()
          }, delay)
        }
        this.lyricEvents.onPlay(this.currentInfo.lineNum, currentLine)
      } else {
        const newCurLineNum = this.handleFindCurrentLineNum(currentTime, this.currentInfo.lineNum + 1)
        if (newCurLineNum > this.currentInfo.lineNum) this.currentInfo.lineNum = newCurLineNum - 1
        this.refresh()
      }

      return
    }

    this.currentInfo.lineNum = this.handleFindCurrentLineNum(currentTime, this.currentInfo.lineNum) - 1
    this.refresh()
  }

  /**
   * Play lyric
   * @param time play time, unit: ms
   */
  play(curTime = 0) {
    if (!this.lyricInfo.lyrics.length) return

    this.pause()
    this.currentInfo.playing = true

    this.currentInfo.performanceTime = handleGetNowTime() - Math.trunc(this.lyricConfig.offset)
    this.currentInfo.startTime = curTime

    this.currentInfo.lineNum = this.handleFindCurrentLineNum(this.handleGetCurrentTime()) - 1

    this.refresh()
  }

  /**
   * Pause lyric
   */
  pause() {
    if (!this.currentInfo.playing) return
    this.currentInfo.playing = false
    timeoutTools.clear()
    if (this.currentInfo.lineNum === this.currentInfo.maxLineNum) return
    const curLineNum = this.handleFindCurrentLineNum(this.handleGetCurrentTime())
    if (this.currentInfo.lineNum !== curLineNum) {
      this.currentInfo.lineNum = curLineNum
      this.lyricEvents.onPlay(curLineNum, this.lyricInfo.lyrics[curLineNum])
    }
  }

  /**
   * Set playback rate
   * @param playbackRate playback rate
   */
  setPlaybackRate(playbackRate: NonNullableOptions['playbackRate']) {
    this.lyricConfig.playbackRate = playbackRate
    if (!this.lyricInfo.lyrics.length) return
    if (!this.currentInfo.playing) return
    this.play(this.handleGetCurrentTime())
  }

  /**
   * Set lyric
   * @param lyricStr lyric file text
   * @param extendedLyricStrs extended lyric file text array, for example lyric translations
   */
  setLyric(lyricInfo: LyricInfo) {
    if (this.currentInfo.playing) this.pause()
    this.lyricInfo = lyricInfo
    this.init()
  }
}

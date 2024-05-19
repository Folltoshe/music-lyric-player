import { findLast } from 'lodash'

interface ParseLyricProps {
  original?: string
  translated?: string
  roman?: string
  dynamic?: string
}
interface PureLyricInfo {
  scroll: boolean
  lyrics: {
    time: number
    lyric: string
    originalLyric?: string
    translatedLyric?: string
    romanLyric?: string
  }[]
}
interface DynamicLyricWord {
  // 时间
  time: number
  // 时长
  duration: number
  // 内容
  text: string
  // 配置
  config: {
    // 是否为中日韩字符
    cjk: boolean
    // 空格结尾
    spaceEnd: boolean
    // 尾部拖长音
    trailing: boolean
  }
}

export interface LyricLine {
  // 时间
  time: number
  // 时长
  duration: number
  // 歌词
  content: {
    // 原文
    original: string
    // 翻译
    translated?: string
    // 罗马音
    roman?: string
    // 动态
    dynamic?: {
      time: number
      words: DynamicLyricWord[]
    }
  }
}
export interface LyricInfo {
  // 是否可以滚动
  scroll: boolean
  // 歌词内容
  lyrics: LyricLine[]
}

export const EMPTY_LYRIC_LINE: LyricLine = {
  time: 0,
  duration: 0,
  content: {
    original: '',
  },
}
export const EMPTY_LYRIC_INFO: LyricInfo = {
  scroll: false,
  lyrics: [],
}

const PURE_MUSIC_LYRIC_LINE = [
  {
    time: 0,
    duration: 5940000,
    content: {
      original: '纯音乐，请欣赏',
    },
  },
]
const DEFAULT_DYNAMIC_CONFIG: DynamicLyricWord['config'] = {
  cjk: false,
  spaceEnd: false,
  trailing: false,
}

export class LyricParser {
  private readonly REGEXP = {
    CJK: /([\p{Unified_Ideograph}|\u3040-\u309F|\u30A0-\u30FF])/gu,
    SPACE_END: /\s$/,
    DYNAMIC_LINE: /^\[((?<min>[0-9]+):)?(?<sec>[0-9]+([\.:]([0-9]+))?)\](?<line>.*)/,
    DYNAMIC_LINE_WORD: /^\<(?<time>[0-9]+),(?<duration>[0-9]+)\>(?<word>[^\<]*)/,
    TIME: /^\[((?<min>[0-9]+):)?(?<sec>[0-9]+([\.:]([0-9]+))?)\]/,
  }

  private calcSimularity(a: string, b: string) {
    if (typeof a === 'undefined') a = ''
    if (typeof b === 'undefined') b = ''
    const m = a.length
    const n = b.length
    const d: number[][] = []
    for (let i = 0; i <= m; i++) {
      d[i] = []
      d[i][0] = i
    }
    for (let j = 0; j <= n; j++) {
      d[0][j] = j
    }
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          d[i][j] = d[i - 1][j - 1]
        } else {
          d[i][j] = Math.min(d[i - 1][j - 1] + 1, d[i][j - 1] + 1, d[i - 1][j] + 1)
        }
      }
    }
    return d[m][n]
  }
  private isEnglishSentense(str: string) {
    if (str.replace(/[\p{P}\p{S}]/gu, '').match(/^[\s\w\u00C0-\u024F]+$/u)) return true
    return false
  }
  private replaceChineseSymbolsToEnglish(str: string) {
    return str
      .replace(/[‘’′]/g, "'")
      .replace(/[“”″]/g, '"')
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/，/g, ',')
      .replace(/！/g, '!')
      .replace(/？/g, '?')
      .replace(/：/g, ':')
      .replace(/；/g, ';')
  }
  private handleParseLyricTime(minute: string, second: string) {
    const min = Number(minute) || 0
    const sec = Number(second.replace(/:/, '.')) || 0
    return Math.floor((min * 60 + sec) * 1000)
  }

  private parsePureLyric(lyric: string): PureLyricInfo {
    const result: PureLyricInfo['lyrics'] = []

    for (const line of lyric.split('\n')) {
      let lyric = line.trim()
      const timestamps: number[] = []
      while (true) {
        const matches = lyric.match(this.REGEXP.TIME)
        if (!matches) break
        timestamps.push(this.handleParseLyricTime(matches.groups?.min || '0', matches.groups?.sec || '0'))
        lyric = lyric.slice(0, matches.index) + lyric.slice((matches.index || 0) + matches[0].length)
        lyric = lyric.trim()
      }
      lyric = lyric.trim()
      for (const time of timestamps) result.push({ time, lyric })
    }

    if (result.length === 0 && lyric.trim().length > 0)
      return { scroll: false, lyrics: this.parseUnsyncedLyrics(lyric) }

    return { scroll: true, lyrics: result.sort((a, b) => a.time - b.time) }
  }
  private parseUnsyncedLyrics(lyric: string): PureLyricInfo['lyrics'] {
    const result: PureLyricInfo['lyrics'] = []
    for (const line of lyric.split('\n')) {
      const lyric = line.trim()
      if (!lyric.length) continue
      result.push({ time: 0, lyric })
    }
    return result
  }
  private parsePureDynamicLyric(lyric: string): LyricLine[] {
    const result: LyricLine[] = []

    for (const line of lyric.trim().split('\n')) {
      let tmp = line.trim()

      const lineMatches = tmp.match(this.REGEXP.DYNAMIC_LINE)
      if (!lineMatches) continue

      tmp = lineMatches.groups?.line || ''
      const timestamp = this.handleParseLyricTime(lineMatches.groups?.min || '0', lineMatches.groups?.sec || '0')
      const words: DynamicLyricWord[] = []

      while (tmp.length > 0) {
        const wordMatches = tmp.match(this.REGEXP.DYNAMIC_LINE_WORD)
        if (!wordMatches) break

        const wordTime = parseInt(wordMatches.groups?.time || '0')
        const wordDuration = parseInt(wordMatches.groups?.duration || '0')
        const word = wordMatches.groups?.word.trimStart()

        const splitedWords = word?.split(/\s+/).filter(v => v.trim().length > 0) // 有些歌词一个单词还是一个句子的就离谱
        if (splitedWords) {
          const splitedDuration = wordDuration / splitedWords.length
          splitedWords.forEach((subWord, i) => {
            if (i === splitedWords.length - 1) {
              if (/\s/.test((word ?? '')[(word ?? '').length - 1])) {
                words.push({
                  time: wordTime + i * splitedDuration,
                  duration: splitedDuration,
                  text: `${subWord.trimStart()} `,
                  config: DEFAULT_DYNAMIC_CONFIG,
                })
              } else {
                words.push({
                  time: wordTime + i * splitedDuration,
                  duration: splitedDuration,
                  text: subWord.trimStart(),
                  config: DEFAULT_DYNAMIC_CONFIG,
                })
              }
            } else if (i === 0) {
              if (/\s/.test((word ?? '')[0])) {
                words.push({
                  time: wordTime + i * splitedDuration,
                  duration: splitedDuration,
                  text: ` ${subWord.trimStart()}`,
                  config: DEFAULT_DYNAMIC_CONFIG,
                })
              } else {
                words.push({
                  time: wordTime + i * splitedDuration,
                  duration: splitedDuration,
                  text: subWord.trimStart(),
                  config: DEFAULT_DYNAMIC_CONFIG,
                })
              }
            } else {
              words.push({
                time: wordTime + i * splitedDuration,
                duration: splitedDuration,
                text: `${subWord.trimStart()} `,
                config: DEFAULT_DYNAMIC_CONFIG,
              })
            }
          })
        }

        tmp = tmp.slice(wordMatches.index || 0 + wordMatches[0].length)
      }

      result.push({
        time: timestamp,
        duration: words.map(v => v.duration).reduce((a, b) => a + b, 0),
        content: { original: words.map(v => v.text).join(''), dynamic: { time: timestamp, words } },
      })
    }

    return result.sort((a, b) => a.time - b.time)
  }

  private processLyric(lyric: LyricLine[]): LyricLine[] {
    if (lyric.length > 0 && lyric[lyric.length - 1].time === 5940000 && lyric[lyric.length - 1].duration === 0) {
      // 纯音乐
      return PURE_MUSIC_LYRIC_LINE
    }

    const result: LyricLine[] = []

    let isSpace = false
    lyric.forEach((thisLyric, i, lyric) => {
      if (thisLyric.content.original.trim().length === 0) {
        const nextLyric = lyric[i + 1]
        if (nextLyric && nextLyric.time - thisLyric.time > 5000 && !isSpace) {
          result.push(thisLyric)
          isSpace = true
        }
      } else {
        isSpace = false
        result.push(thisLyric)
      }
    })

    while (result[0]?.content.original.length === 0) {
      result.shift()
    }

    if (result[0]?.time > 5000) {
      result.unshift({
        time: 500,
        duration: result[0]?.time - 500,
        content: { original: '' },
      })
    }

    // 在英文句子中转化中文引号到英文分割号，中文标点到英文标点
    for (let i = 0; i < result.length; i++) {
      const thisLine = result[i]
      if (!this.isEnglishSentense(thisLine?.content.original)) continue
      if (thisLine?.content.dynamic?.words) {
        for (let j = 0; j < thisLine.content.dynamic?.words.length; j++) {
          thisLine.content.dynamic.words[j].text = this.replaceChineseSymbolsToEnglish(
            thisLine.content.dynamic?.words[j].text
          )
        }
      }
      if (thisLine?.content.original) {
        thisLine.content.original = this.replaceChineseSymbolsToEnglish(thisLine.content.original)
      }
    }

    return result
  }

  private handleParseDynamicLyric({
    original = '',
    translated = '',
    roman = '',
    dynamic = '',
  }: ParseLyricProps): LyricInfo {
    const processed = this.parsePureDynamicLyric(dynamic)
    const originalLyrics = this.parsePureLyric(original)

    const attachOriginalLyric = (lyric: PureLyricInfo['lyrics']) => {
      let attachMatchingMode = 'equal'

      const lyricTimeSet = new Set(lyric.map(v => v.time))
      const originalLyricTimeSet = new Set(originalLyrics.lyrics.map(v => v.time))
      const intersection = new Set([...lyricTimeSet].filter(v => originalLyricTimeSet.has(v)))
      if (intersection.size / lyricTimeSet.size < 0.1) {
        attachMatchingMode = 'closest'
      }

      originalLyrics.lyrics.forEach(line => {
        let target: PureLyricInfo['lyrics'][number] | null = null
        if (attachMatchingMode === 'equal') {
          target = findLast(lyric, v => Math.abs(v.time - line.time) < 20)!
        } else {
          lyric.forEach(v => {
            if (target) {
              if (Math.abs(target.time - line.time) > Math.abs(v.time - line.time)) target = v
            } else target = v
          })
        }

        if (target) {
          target.originalLyric = target.originalLyric || ''
          if (target.originalLyric.length > 0) target.originalLyric += ' '
          target.originalLyric += line.lyric
        }
      })

      return lyric
    }
    const attachLyricToDynamic = (
      lyric: PureLyricInfo['lyrics'],
      field: keyof Omit<LyricLine['content'], 'dynamic'>
    ) => {
      lyric.forEach(line => {
        let targetIndex = 0
        processed.forEach((v, index) => {
          if (Math.abs(processed[targetIndex].time - line.time) > Math.abs(v.time - line.time)) targetIndex = index
        })
        let sequence = [targetIndex]
        for (let offset = 1; offset <= 5; offset++) {
          if (targetIndex - offset >= 0) sequence.push(targetIndex - offset)
          if (targetIndex + offset < processed.length) sequence.push(targetIndex + offset)
        }

        sequence = sequence.reverse()

        let minWeight = 1000000000

        for (let index of sequence) {
          const v = processed[index]
          const similarity = this.calcSimularity(line.originalLyric!, v.content.original)
          const weight = similarity * 1000 + (v.content[field] ? 1 : 0)

          if (weight < minWeight) {
            minWeight = weight
            targetIndex = index
          }
        }

        const target = processed[targetIndex]

        target.content[field] = target.content[field] || ''
        if (target.content[field]!.length > 0) target.content[field] += ' '
        target.content[field] += line.lyric
      })
    }

    const translatedParsed = attachOriginalLyric(this.parsePureLyric(translated).lyrics)
    const romanParsed = attachOriginalLyric(this.parsePureLyric(roman).lyrics)

    attachLyricToDynamic(translatedParsed, 'translated')
    attachLyricToDynamic(romanParsed, 'roman')

    // 插入空行
    for (let i = 0; i < processed.length; i++) {
      const thisLine = processed[i]
      const nextLine = processed[i + 1]
      if (
        thisLine &&
        nextLine &&
        thisLine.content.original.trim().length > 0 &&
        nextLine.content.original.trim().length > 0 &&
        thisLine.duration > 0
      ) {
        const thisLineEndTime = (thisLine?.content.dynamic?.time || thisLine.time) + thisLine.duration
        let nextLineStartTime = nextLine.time
        if (nextLine.content.dynamic?.time && nextLineStartTime > nextLine.content.dynamic?.time) {
          nextLineStartTime = nextLine.content.dynamic?.time
        }
        if (nextLineStartTime - thisLineEndTime >= 5000) {
          processed.splice(i + 1, 0, {
            time: thisLineEndTime,
            duration: nextLineStartTime - thisLineEndTime,
            content: { original: '' },
          })
        }
      }
    }

    //同步原文空格到逐字
    for (let i = 0; i < processed.length; i++) {
      const thisLine = processed[i]
      let raw = thisLine.content.original?.trim() ?? ''
      const dynamic = thisLine.content.dynamic?.words || []

      for (let j = 0; j < dynamic.length; j++) {
        const thisWord = dynamic[j].text.trimEnd()
        if (raw.startsWith(thisWord)) {
          raw = raw.substring(thisWord.length)
        } else {
          break
        }
        const match = raw.match(/^\s+/)
        if (match) {
          raw = raw.substring(match[0].length)
          if (!dynamic[j].text.match(/\s$/)) {
            dynamic[j].text += ' '
          }
        }
      }
    }

    // 标记 CJK 字符和是否空格结尾
    for (let i = 0; i < processed.length; i++) {
      const thisLine = processed[i]
      const dynamic = thisLine.content.dynamic?.words || []
      for (let j = 0; j < dynamic.length; j++) {
        const cjk = !!dynamic[j]?.text?.match(this.REGEXP.CJK)
        const spaceEnd = !!dynamic[j]?.text?.match(this.REGEXP.SPACE_END)
        dynamic[j].config = { ...dynamic[j].config, cjk, spaceEnd }
      }
    }

    // 标记尾部拖长音
    // 尾部或每个空格之前的第一个非特殊符号字符，长度超过 1 秒
    for (let i = 0; i < processed.length; i++) {
      const thisLine = processed[i]
      const dynamic = thisLine.content.dynamic?.words || []

      const searchIndexes: number[] = [-1]
      for (let j = 0; j < dynamic.length - 1; j++) {
        if (
          dynamic[j]?.config.spaceEnd ||
          dynamic[j]?.text?.match(/[\,\.\，\。\!\?\？\、\；\：\…\—\~\～\·\‘\’\“\”\ﾞ]/)
        ) {
          if (!dynamic[j]?.text?.match(/[a-zA-Z]+(\'\‘\’)*[a-zA-Z]*/)) {
            searchIndexes.push(j)
          }
        }
      }
      searchIndexes.push(dynamic.length - 1)

      for (let j = searchIndexes.length - 1; j >= 1; j--) {
        let targetIndex: number | null = null
        for (let k = searchIndexes[j]; k > searchIndexes[j - 1]; k--) {
          const word = dynamic[k].text.trim()
          if (word.match(/[\p{P}\p{S}]/gu)) {
            continue
          }
          if (word.match(/^\s*$/)) {
            continue
          }
          targetIndex = k
          break
        }
        if (targetIndex === null) {
          continue
        }
        const target = dynamic[targetIndex]
        if (target.duration >= 1000) {
          target.config = { ...target.config, trailing: true }
        }
      }
    }

    return { scroll: originalLyrics.scroll, lyrics: this.processLyric(processed) }
  }
  private handleParseLyric({ original = '', translated = '', roman = '' }: ParseLyricProps): LyricInfo {
    const parsedLyric = this.parsePureLyric(original)
    const result: LyricInfo = {
      scroll: parsedLyric.scroll,
      lyrics: parsedLyric.lyrics.map(v => ({
        time: v.time,
        duration: 0,
        content: {
          original: v.lyric,
        },
      })),
    }

    this.parsePureLyric(translated).lyrics.forEach(line => {
      const target = result.lyrics.find(v => v.time === line.time)
      if (target) target.content.translated = line.lyric
    })
    this.parsePureLyric(roman).lyrics.forEach(line => {
      const target = result.lyrics.find(v => v.time === line.time)
      if (target) target.content.roman = line.lyric
    })

    result.lyrics.sort((a, b) => a.time - b.time)

    const processed = this.processLyric(result.lyrics)
    for (let i = 0; i < processed.length; i++) {
      if (i < processed.length - 1) {
        processed[i].duration = processed[i + 1].time - processed[i].time
      }
    }

    return { scroll: result.scroll, lyrics: this.processLyric(result.lyrics) }
  }

  parseLyric(props: ParseLyricProps): LyricInfo {
    if (props?.dynamic?.trim().length) return this.handleParseDynamicLyric(props)
    else return this.handleParseLyric(props)
  }
}

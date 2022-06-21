import moment from 'moment'

interface TimeModel {
  getNowDate: (format?: string) => string
  convertSecondsToMs: (seconds: number) => number
}

export const getNowDate = (format: string = 'YYYY-MM-DD HH:mm:ss'): string => moment().format(format)

export const convertSecondsToMs = (seconds: number): number => {
  return seconds * 1000
}

const time: TimeModel = {
  getNowDate,
  convertSecondsToMs,
}

export default time

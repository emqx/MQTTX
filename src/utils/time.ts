import moment from 'moment'

interface TimeModel {
  getNowDate: (format?: string) => string
  convertSecondsToMs: (seconds: number) => number
  sqliteDateFormat: string
  toFormat: (date: Date | string) => string
  getDateBefore: (minutes: number) => string
}

export const sqliteDateFormat = 'YYYY-MM-DD HH:mm:ss:SSS'

export const getNowDate = (format: string = sqliteDateFormat): string => moment().format(format)

export const toFormat = (date: Date | string): string => moment(date).format(sqliteDateFormat)

export const convertSecondsToMs = (seconds: number): number => seconds * 1000

export const getDateBefore = (minutes: number): string => moment().subtract(minutes, 'minutes').format(sqliteDateFormat)

const time: TimeModel = {
  getNowDate,
  convertSecondsToMs,
  sqliteDateFormat,
  toFormat,
  getDateBefore,
}

export default time

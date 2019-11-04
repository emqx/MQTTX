import moment from 'moment'

interface TimeModel {
  getNowDate: (format?: string) => string
}

export const getNowDate = (format: string = 'YYYY-MM-DD HH:mm:ss'): string => moment().format(format)

const time: TimeModel = {
  getNowDate,
}

export default time

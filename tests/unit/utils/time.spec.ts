import { expect } from 'chai'
import moment from 'moment'
import { getNowDate, toFormat, convertSecondsToMs, sqliteDateFormat, getDateBefore } from '@/utils/time'

describe('time utility', () => {
  it('getNowDate should return current date in the specified format', () => {
    const now = getNowDate()
    expect(now).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d{3}$/)

    const customFormat = 'YYYY-MM-DD'
    const customNow = getNowDate(customFormat)
    expect(customNow).to.match(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('toFormat should convert date to sqliteDateFormat', () => {
    const testDate = new Date('2023-05-15T12:30:45.678Z')
    const formattedDate = toFormat(testDate)
    expect(formattedDate).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d{3}$/)
  })

  it('convertSecondsToMs should correctly convert seconds to milliseconds', () => {
    expect(convertSecondsToMs(1)).to.equal(1000)
    expect(convertSecondsToMs(0.5)).to.equal(500)
    expect(convertSecondsToMs(2.5)).to.equal(2500)
  })

  it('sqliteDateFormat should be the correct format string', () => {
    expect(sqliteDateFormat).to.equal('YYYY-MM-DD HH:mm:ss:SSS')
  })

  it('getNowDate and toFormat should use the same format', () => {
    const now = new Date()
    const formattedNow = toFormat(now)
    const getNowResult = getNowDate()

    // Allow for a small time difference (up to 1 second) due to execution time
    const momentNow = moment(now)
    const momentFormatted = moment(formattedNow, sqliteDateFormat)
    const momentGetNow = moment(getNowResult, sqliteDateFormat)

    expect(Math.abs(momentNow.diff(momentFormatted, 'seconds'))).to.be.at.most(1)
    expect(Math.abs(momentNow.diff(momentGetNow, 'seconds'))).to.be.at.most(1)
  })

  it('should return date before specified minutes in correct format', () => {
    const minutes = 30
    const result = getDateBefore(minutes)

    expect(result).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d{3}$/)

    const now = moment()
    const dateBefore = moment(result, sqliteDateFormat)
    const diffInMinutes = now.diff(dateBefore, 'minutes')

    expect(diffInMinutes).to.be.approximately(minutes, 1)
  })

  it('should handle different minute values', () => {
    const testCases = [5, 60, 1440]

    testCases.forEach((minutes) => {
      const result = getDateBefore(minutes)
      const now = moment()
      const dateBefore = moment(result, sqliteDateFormat)
      const diffInMinutes = now.diff(dateBefore, 'minutes')

      expect(diffInMinutes).to.be.approximately(minutes, 1)
    })
  })

  it('should use the same format as other time functions', () => {
    const result = getDateBefore(10)
    const formatRegex = sqliteDateFormat
      .replace(/YYYY/g, '\\d{4}')
      .replace(/MM|DD|HH|mm|ss/g, '\\d{2}')
      .replace(/SSS/g, '\\d{3}')

    expect(result).to.match(new RegExp(formatRegex))
  })

  it('all time functions should use the same format', () => {
    const now = new Date()
    const formattedNow = toFormat(now)
    const getNowResult = getNowDate()
    const getBeforeResult = getDateBefore(0) // 0 minutes before now

    const momentNow = moment(now)
    const momentFormatted = moment(formattedNow, sqliteDateFormat)
    const momentGetNow = moment(getNowResult, sqliteDateFormat)
    const momentBefore = moment(getBeforeResult, sqliteDateFormat)

    expect(Math.abs(momentNow.diff(momentFormatted, 'seconds'))).to.be.at.most(1)
    expect(Math.abs(momentNow.diff(momentGetNow, 'seconds'))).to.be.at.most(1)
    expect(Math.abs(momentNow.diff(momentBefore, 'seconds'))).to.be.at.most(1)
  })
})

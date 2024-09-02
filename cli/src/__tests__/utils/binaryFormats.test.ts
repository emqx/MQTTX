import isSupportedBinaryFormatForMQTT, { supportedBinaryFormatsForMQTT } from '../../utils/binaryFormats'

describe('isSupportedBinaryFormatForMQTT', () => {
  it('should return true for supported binary formats', () => {
    const supportedFormats = ['.png', '.mp4', '.mp3', '.zip', '.exe', '.pdf']
    supportedFormats.forEach((format) => {
      expect(isSupportedBinaryFormatForMQTT(format)).toBe(true)
    })
  })

  it('should return false for unsupported binary formats', () => {
    const unsupportedFormats = ['.txt', '.doc', '.xls', '.ppt', '.html', '.css']
    unsupportedFormats.forEach((format) => {
      expect(isSupportedBinaryFormatForMQTT(format)).toBe(false)
    })
  })

  it('should be case-sensitive', () => {
    expect(isSupportedBinaryFormatForMQTT('.PNG')).toBe(false)
    expect(isSupportedBinaryFormatForMQTT('.png')).toBe(true)
  })

  it('should include all supported formats', () => {
    supportedBinaryFormatsForMQTT.forEach((format) => {
      expect(isSupportedBinaryFormatForMQTT(format)).toBe(true)
    })
  })
})

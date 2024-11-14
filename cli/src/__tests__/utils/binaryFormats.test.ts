import isSupportedBinaryFormatForMQTT, { supportedBinaryFormatsForMQTT } from '../../utils/binaryFormats'
import { expect, describe, it } from '@jest/globals'

describe('isSupportedBinaryFormatForMQTT', () => {
  it('should return true for supported binary formats', () => {
    const supportedFormats = [
      // Common formats
      '.png',
      '.mp4',
      '.mp3',
      '.zip',
      '.exe',
      '.pdf',
      // Network & Protocol formats
      '.netp',
      '.pcap',
      '.pcapng',
      '.cap',
      '.dmp',
      '.trace',
      // Database formats
      '.db',
      '.sqlite',
      '.mdb',
      '.frm',
      '.myd',
      '.myi',
      // IoT & Device formats
      '.dat',
      '.raw',
      '.log',
      '.blob',
      '.hex',
      '.rom',
      '.fw',
      // Custom protocol & data formats
      '.pkt',
      '.mpack',
      '.parquet',
      '.orc',
    ]
    supportedFormats.forEach((format) => {
      expect(isSupportedBinaryFormatForMQTT(format)).toBe(true)
    })
  })

  it('should return false for unsupported binary formats', () => {
    const unsupportedFormats = [
      // Text formats
      '.txt',
      '.md',
      '.rtf',
      // Document formats
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      // Web formats
      '.html',
      '.css',
      '.js',
      '.json',
      '.xml',
      // Source code formats
      '.c',
      '.cpp',
      '.java',
      '.py',
      '.ts',
      // Config formats
      '.yml',
      '.ini',
      '.conf',
      '.env',
    ]
    unsupportedFormats.forEach((format) => {
      expect(isSupportedBinaryFormatForMQTT(format)).toBe(false)
    })
  })

  it('should be case-sensitive', () => {
    const testCases = [
      ['.PNG', '.png'],
      ['.DB', '.db'],
      ['.NETP', '.netp'],
      ['.PCAP', '.pcap'],
      ['.HEX', '.hex'],
    ]

    testCases.forEach(([upper, lower]) => {
      expect(isSupportedBinaryFormatForMQTT(upper)).toBe(false)
      expect(isSupportedBinaryFormatForMQTT(lower)).toBe(true)
    })
  })

  it('should include all supported formats', () => {
    supportedBinaryFormatsForMQTT.forEach((format) => {
      expect(isSupportedBinaryFormatForMQTT(format)).toBe(true)
    })
  })

  it('should handle format categories correctly', () => {
    // Test by categories
    const categories = {
      image: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.tif', '.tiff'],
      video: ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.mpeg', '.3gp'],
      audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.m4p'],
      compressed: ['.zip', '.gz', '.rar', '.tar', '.7z', '.bz2', '.xz', '.jar'],
      network: ['.netp', '.pcap', '.pcapng', '.cap', '.dmp', '.trace'],
      database: ['.db', '.sqlite', '.mdb', '.frm', '.myd', '.myi'],
      device: ['.dat', '.raw', '.log', '.blob', '.hex', '.rom', '.fw'],
      protocol: ['.pkt', '.mpack', '.parquet', '.orc'],
    }

    Object.values(categories)
      .flat()
      .forEach((format) => {
        expect(isSupportedBinaryFormatForMQTT(format)).toBe(true)
      })
  })
})

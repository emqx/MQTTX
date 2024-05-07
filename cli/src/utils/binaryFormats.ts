const supportedBinaryFormatsForMQTT = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.ico',
  '.tif',
  '.tiff', // Image file formats
  '.mp4',
  '.avi',
  '.mov',
  '.mkv',
  '.flv',
  '.wmv',
  '.mpeg',
  '.3gp', // Video file formats
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
  '.ogg',
  '.wma',
  '.m4a',
  '.m4p', // Audio file formats
  '.zip',
  '.gz',
  '.rar',
  '.tar',
  '.7z',
  '.bz2',
  '.xz',
  '.jar', // Compressed file formats
  '.bin',
  '.exe',
  '.dll',
  '.so',
  '.dmg',
  '.iso',
  '.img', // Binary file formats
  '.pdf',
  '.epub', // Binary document file formats
]

const isSupportedBinaryFormatForMQTT = (fileExtname: string) => {
  return supportedBinaryFormatsForMQTT.includes(fileExtname)
}

export default isSupportedBinaryFormatForMQTT

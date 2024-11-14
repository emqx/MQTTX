export const supportedBinaryFormatsForMQTT = [
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
  '.netp', // Network protocol binary format
  '.pcap', // Packet capture
  '.pcapng', // Next generation packet capture
  '.cap', // Network capture
  '.dmp', // Memory dump
  '.trace', // Network trace
  '.db', // Generic database
  '.sqlite', // SQLite database
  '.mdb', // Microsoft Access database
  '.frm', // MySQL table definition
  '.myd', // MySQL data
  '.myi', // MySQL index
  '.dat', // Generic data file
  '.raw', // Raw data
  '.log', // Binary log
  '.blob', // Binary large object
  '.hex', // Hex dump
  '.rom', // ROM image
  '.fw', // Firmware
  '.pkt', // Packet data
  '.mpack', // MessagePack data
  '.parquet', // Parquet columnar storage
  '.orc', // Optimized Row Columnar
]

const isSupportedBinaryFormatForMQTT = (fileExtname: string) => {
  return supportedBinaryFormatsForMQTT.includes(fileExtname)
}

export default isSupportedBinaryFormatForMQTT

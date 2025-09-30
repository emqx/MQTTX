import { BrowserWindow, dialog } from 'electron'
import fs from 'fs'
import YAML from 'js-yaml'
import XMLConvert from 'xml-js'
import { parse as CSVConvert } from 'json2csv'
import ExcelConvert from 'xlsx'
import { replaceSpecialDataTypes } from '@/utils/importExportTypes'
import { JSONStreamWriter } from '@/utils/jsonStreamWriter'
import useServices from '@/database/useServices'

type ExportFormat = 'JSON' | 'YAML' | 'XML' | 'CSV' | 'Excel'

interface StreamExportOptions {
  filename: string
  format: ExportFormat
  connectionId?: string
  onProgress?: (progress: number) => void
}

export class StreamDataExporter {
  private win: BrowserWindow
  private filePath: string = ''
  private fileDescriptor: number | null = null
  private totalConnections = 0
  private processedConnections = 0

  constructor(win: BrowserWindow) {
    this.win = win
  }

  private async streamMessages(connectionId: string): Promise<MessageModel[]> {
    const { messageService } = useServices()
    const messages: MessageModel[] = []
    const messageGenerator = messageService.streamMessagesForExport(connectionId)

    for await (const messageBatch of messageGenerator) {
      messages.push(...messageBatch)
    }

    return messages
  }

  private updateProgress(onProgress?: (progress: number) => void): void {
    const progress = (this.processedConnections / this.totalConnections) * 100
    onProgress?.(progress / 100)
  }

  public async export(options: StreamExportOptions): Promise<void> {
    const { filename, format, connectionId, onProgress } = options

    try {
      // Get file extension based on format
      const getExtension = (fmt: ExportFormat): string => {
        const extensions: Record<ExportFormat, string> = {
          JSON: 'json',
          YAML: 'yaml',
          XML: 'xml',
          CSV: 'csv',
          Excel: 'xlsx',
        }
        return extensions[fmt]
      }

      // Show save dialog
      const result = await dialog.showSaveDialog(this.win, {
        title: 'Export Data',
        defaultPath: `${filename}.${getExtension(format)}`,
      })

      if (!result.filePath) {
        return
      }

      this.filePath = result.filePath

      // Get connections for export (without messages)
      const { connectionService } = useServices()
      const connections = await connectionService.getConnectionsForExport(connectionId)

      if (connections.length === 0) {
        this.win.webContents.send('exportError', 'No data to export')
        return
      }

      this.totalConnections = connections.length
      this.processedConnections = 0
      onProgress?.(0)

      // Handle different formats
      switch (format) {
        case 'JSON':
          await this.exportJSON(connections, onProgress)
          break
        case 'YAML':
          await this.exportYAML(connections, onProgress)
          break
        case 'XML':
          await this.exportXML(connections, onProgress)
          break
        case 'CSV':
          await this.exportCSV(connections, onProgress)
          break
        case 'Excel':
          await this.exportExcel(connections, onProgress)
          break
      }

      this.win.webContents.send('saved')
    } catch (error) {
      console.error('Export error:', error)
      const err = error as Error
      this.win.webContents.send('exportError', err.message)
    } finally {
      this.cleanup()
    }
  }

  private async exportJSON(connections: ConnectionModel[], onProgress?: (progress: number) => void): Promise<void> {
    const writer = new JSONStreamWriter(this.filePath)
    const { messageService } = useServices()

    try {
      for (const connection of connections) {
        const messageGenerator = messageService.streamMessagesForExport(connection.id!)
        const { messages: _, ...connectionWithoutMessages } = connection

        await writer.writeObjectWithStreamingArray(connectionWithoutMessages, 'messages', messageGenerator, 2)

        this.processedConnections++
        this.updateProgress(onProgress)
      }
    } finally {
      writer.close()
    }
  }

  private async exportYAML(connections: ConnectionModel[], onProgress?: (progress: number) => void): Promise<void> {
    const connectionsWithMessages: ConnectionModel[] = []

    for (const connection of connections) {
      const messages = await this.streamMessages(connection.id!)
      connectionsWithMessages.push({ ...connection, messages })

      this.processedConnections++
      this.updateProgress(onProgress)
    }

    const yamlContent = YAML.dump(connectionsWithMessages)
    fs.writeFileSync(this.filePath, yamlContent)
  }

  private async exportXML(connections: ConnectionModel[], onProgress?: (progress: number) => void): Promise<void> {
    this.fileDescriptor = fs.openSync(this.filePath, 'w')
    fs.writeSync(this.fileDescriptor, '<?xml version="1.0" encoding="utf-8"?>\n<root>\n')

    for (const connection of connections) {
      const messages = await this.streamMessages(connection.id!)
      const connectionWithMessages = { ...connection, messages }
      const jsonContent = replaceSpecialDataTypes(JSON.stringify(connectionWithMessages))
      let xmlContent = XMLConvert.json2xml(jsonContent, { compact: true, ignoreComment: true, spaces: 2 })
      xmlContent = xmlContent.replace(/<([0-9]*)>/g, '<oneConnection>').replace(/<(\/[0-9]*)>/g, '</oneConnection>')

      fs.writeSync(this.fileDescriptor, '<oneConnection>\n')
      fs.writeSync(this.fileDescriptor, xmlContent)
      fs.writeSync(this.fileDescriptor, '\n</oneConnection>\n')

      this.processedConnections++
      this.updateProgress(onProgress)
    }

    fs.writeSync(this.fileDescriptor, '</root>')
  }

  private async exportCSV(connections: ConnectionModel[], onProgress?: (progress: number) => void): Promise<void> {
    const flattenedData: any[] = []

    for (const connection of connections) {
      const messages = await this.streamMessages(connection.id!)

      // Flatten connection data with messages
      const flatConnection = {
        ...connection,
        messages: JSON.stringify(messages),
        subscriptions: JSON.stringify(connection.subscriptions),
        will: JSON.stringify(connection.will),
        properties: JSON.stringify(connection.properties),
      }

      flattenedData.push(flatConnection)

      this.processedConnections++
      this.updateProgress(onProgress)
    }

    const csvContent = CSVConvert(flattenedData).replace(/"(\d+\.(\d+)?0)"/g, '="$1"')
    fs.writeFileSync(this.filePath, csvContent)
  }

  private async exportExcel(connections: ConnectionModel[], onProgress?: (progress: number) => void): Promise<void> {
    const workbook = ExcelConvert.utils.book_new()

    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i]

      const messages = await this.streamMessages(connection.id!)
      const connectionWithMessages = { ...connection, messages }
      const worksheet = ExcelConvert.utils.json_to_sheet([connectionWithMessages])

      // Format nested objects as strings
      Object.keys(worksheet).forEach((cell) => {
        if (worksheet[cell].t === undefined && cell !== '!ref') {
          const stringValue = JSON.stringify(worksheet[cell])
          worksheet[cell] = { t: 's', v: stringValue }
        }
      })

      const sheetName = `Connection_${i + 1}`
      ExcelConvert.utils.book_append_sheet(workbook, worksheet, sheetName)

      this.processedConnections++
      this.updateProgress(onProgress)
    }

    ExcelConvert.writeFile(workbook, this.filePath)
  }

  private cleanup(): void {
    if (this.fileDescriptor !== null) {
      try {
        fs.closeSync(this.fileDescriptor)
      } catch (error) {
        console.error('Error closing file descriptor:', error)
      }
      this.fileDescriptor = null
    }
    this.processedConnections = 0
    this.totalConnections = 0
  }
}

// Main export function that will be called from the main process
export const streamExportData = async (win: BrowserWindow, options: StreamExportOptions): Promise<void> => {
  const exporter = new StreamDataExporter(win)
  await exporter.export(options)
}

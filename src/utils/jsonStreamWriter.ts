import fs from 'fs'

/**
 * A utility class for streaming JSON array output to a file
 * This avoids loading entire dataset into memory
 */
export class JSONStreamWriter {
  private fd: number
  private isFirstItem = true

  constructor(filePath: string) {
    this.fd = fs.openSync(filePath, 'w')
    fs.writeSync(this.fd, '[\n')
  }

  /**
   * Write an object to the JSON array
   * @param obj - The object to write
   * @param indent - Indentation level (number of spaces)
   */
  public writeObject(obj: Record<string, any>, indent: number = 2): void {
    if (!this.isFirstItem) {
      fs.writeSync(this.fd, ',\n')
    }
    this.isFirstItem = false

    const json = JSON.stringify(obj, null, indent)
    const indented = this.indentLines(json, indent)
    fs.writeSync(this.fd, indented)
  }

  /**
   * Write an object with a streaming array property
   * @param obj - The base object
   * @param arrayKey - The key for the array property
   * @param arrayGenerator - Async generator that yields array items
   * @param indent - Indentation level
   */
  public async writeObjectWithStreamingArray<T>(
    obj: Record<string, any>,
    arrayKey: string,
    arrayGenerator: AsyncGenerator<T[], void, unknown>,
    indent: number = 2,
  ): Promise<void> {
    if (!this.isFirstItem) {
      fs.writeSync(this.fd, ',\n')
    }
    this.isFirstItem = false

    const spaces = ' '.repeat(indent)

    // Write object opening
    fs.writeSync(this.fd, `${spaces}{\n`)

    // Write all properties except the streaming array
    const entries = Object.entries(obj).filter(([key]) => key !== arrayKey)
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]
      this.writeProperty(key, value, indent + 2)
      fs.writeSync(this.fd, ',\n')
    }

    // Write array property with streaming values
    fs.writeSync(this.fd, `${spaces}  "${arrayKey}": [\n`)

    let isFirstArrayItem = true
    for await (const batch of arrayGenerator) {
      for (const item of batch) {
        if (!isFirstArrayItem) {
          fs.writeSync(this.fd, ',\n')
        }
        isFirstArrayItem = false

        const itemJson = JSON.stringify(item, null, indent)
        const indented = this.indentLines(itemJson, indent + 4)
        fs.writeSync(this.fd, indented)
      }
    }

    // Close array and object
    fs.writeSync(this.fd, `\n${spaces}  ]\n`)
    fs.writeSync(this.fd, `${spaces}}`)
  }

  /**
   * Close the JSON array and file
   */
  public close(): void {
    fs.writeSync(this.fd, '\n]\n')
    fs.closeSync(this.fd)
  }

  /**
   * Helper to write a single property
   */
  private writeProperty(key: string, value: any, indent: number): void {
    const spaces = ' '.repeat(indent)
    const json = JSON.stringify(value, null, 2)
    const indented = this.indentMultilineValue(json, indent)
    fs.writeSync(this.fd, `${spaces}"${key}": ${indented}`)
  }

  /**
   * Indent all lines of a string
   */
  private indentLines(str: string, indent: number): string {
    const spaces = ' '.repeat(indent)
    return str
      .split('\n')
      .map((line, idx) => (idx === 0 ? `${spaces}${line}` : line ? `${spaces}${line}` : line))
      .join('\n')
  }

  /**
   * Indent multi-line JSON values (for object properties)
   */
  private indentMultilineValue(str: string, baseIndent: number): string {
    const lines = str.split('\n')
    if (lines.length === 1) {
      return str
    }
    return lines.map((line, idx) => (idx === 0 ? line : ' '.repeat(baseIndent) + line)).join('\n')
  }
}

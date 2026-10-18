<template>
  <div class="file-card">
    <div class="file-head">
      <button class="file-toggle" type="button" :aria-expanded="String(expanded)" @click="expanded = !expanded">
        <span class="file-ico">
          <i class="el-icon-folder-opened"></i>
        </span>
        <span class="file-info">
          <span class="file-name" :title="name">{{ name }}</span>
          <span class="file-meta">{{ fileCountLabel }} · {{ sizeLabel }}</span>
        </span>
      </button>
      <div class="file-actions">
        <button class="btn" :disabled="missing" @click="download">{{ $t('agent.fileCard.download') }}</button>
        <button class="btn" :disabled="missing" @click="showInFolder">
          {{ $t('agent.fileCard.showInFolder') }}
        </button>
      </div>
    </div>
    <div v-if="missing" class="file-missing">{{ $t('agent.fileCard.missing') }}</div>
    <ul v-if="expanded && files.length" class="file-list">
      <li v-for="file in files" :key="file.path">
        <span class="file-path" :title="file.path">{{ file.path }}</span>
        <span class="file-size">{{ formatSize(file.size) }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import fs from 'fs'
import path from 'path'
import { app, dialog, getCurrentWindow, shell } from '@electron/remote'
import { AgentMessagePart } from '@/types/agent'
import { formatBytes } from '@/utils/formatter'
import { resolveArchive } from '@/utils/ai/agent/files'

interface FileEntry {
  path: string
  size: number
}

interface SaveFilesInput {
  name?: string
  files?: FileEntry[]
}

interface SaveFilesOutput {
  name?: string
  downloadName?: string
  relativePath?: string
  size?: number
}

@Component
export default class AgentFileCard extends Vue {
  @Prop({ required: true }) readonly part!: Extract<AgentMessagePart, { type: 'tool' }>

  private expanded = false
  private missing = false

  get input(): SaveFilesInput {
    return (this.part.input ?? {}) as SaveFilesInput
  }

  get output(): SaveFilesOutput {
    return (this.part.output ?? {}) as SaveFilesOutput
  }

  get name(): string {
    return this.output.name || this.input.name || 'project'
  }

  get files(): FileEntry[] {
    return this.input.files ?? []
  }

  get fileCountLabel(): string {
    return this.$tc('agent.fileCard.fileCount', this.files.length, { n: this.files.length })
  }

  get sizeLabel(): string {
    const total = this.output.size ?? this.files.reduce((sum, file) => sum + (file.size || 0), 0)
    return formatBytes(total)
  }

  created() {
    this.refresh()
  }

  private formatSize(size: number): string {
    return formatBytes(size)
  }

  private async refresh() {
    const resolved = await this.resolve()
    this.missing = !resolved
  }

  private async resolve(): Promise<string | null> {
    if (!this.output.relativePath) return null
    return resolveArchive(this.output.relativePath)
  }

  private async download() {
    const target = await this.resolve()
    if (!target) {
      this.missing = true
      return
    }
    const downloadName = this.output.downloadName || `${this.name}.zip`
    const result = await dialog.showSaveDialog(getCurrentWindow(), {
      defaultPath: path.join(app.getPath('downloads'), downloadName),
      filters: [{ name: 'ZIP', extensions: ['zip'] }],
    })
    if (result.canceled || !result.filePath) return
    // GTK does not append the extension
    let filePath = result.filePath
    if (!filePath.toLowerCase().endsWith('.zip')) filePath += '.zip'
    try {
      await fs.promises.copyFile(target, filePath)
      this.$message.success(this.$tc('agent.fileCard.saveSuccess'))
    } catch (error) {
      this.$message.error(`${this.$tc('agent.fileCard.saveFailed')}: ${(error as Error).message}`)
    }
  }

  private async showInFolder() {
    const target = await this.resolve()
    if (!target) {
      this.missing = true
      return
    }
    shell.showItemInFolder(target)
  }
}
</script>

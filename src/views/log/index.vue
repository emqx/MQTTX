<template>
  <div class="log-view rightbar">
    <div class="titlebar">
      <h1>{{ $t('log.log') }}</h1>
      <el-select size="mini" v-model="selectedLogLevel" @change="updateLogLevel">
        <el-option label="DEBUG" value="debug"></el-option>
        <el-option label="INFO" value="info"></el-option>
        <el-option label="WARN" value="warn"></el-option>
        <el-option label="ERROR" value="error"></el-option>
      </el-select>
    </div>
    <div class="editor-container log-editor">
      <Editor
        ref="logEditor"
        id="log"
        v-model="logValue"
        lineNumbers="on"
        renderHighlight="line"
        wordWrap="on"
        lang="logLanguage"
        :lineHeight="22"
        :isCustomerLang="true"
        :disabled="true"
        :fontSize="14"
        :lineNumbersMinChars="5"
        :editorTheme="editorTheme"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Editor from '@/components/Editor.vue'
import { Getter, Action } from 'vuex-class'
import fs from 'fs-extra'
import { getOrCreateLogDir, watchFileAppender } from '@/utils/logger'
import path from 'path'

@Component({
  components: {
    Editor,
  },
})
export default class Logs extends Vue {
  @Getter('currentTheme') private theme!: Theme
  @Getter('logLevel') private logLevel!: LogLevel

  @Action('SET_LOG_LEVEL') private actionSetLogLevel!: (payload: { logLevel: LogLevel }) => void

  private logValue = ''
  private selectedLogLevel: LogLevel = 'info'

  get editorTheme(): 'editor-log' | 'editor-log-dark' | 'editor-log-night' {
    switch (this.theme) {
      case 'dark':
        return 'editor-log-dark'
      case 'night':
        return 'editor-log-night'
      default:
        return 'editor-log'
    }
  }

  private async loadData(): Promise<void> {
    const LOG_DIR = getOrCreateLogDir()
    const LOG_PATH = path.join(LOG_DIR, 'log')
    // if the log file was removed when the MQTTX running, log4js will not append message to file, so we should do nothing.
    if (!fs.existsSync(LOG_PATH)) return
    fs.readFile(LOG_PATH, 'utf-8', (error, data) => {
      if (error) {
        this.$log.error(error.toString())
        this.$message.error(error.toString())
        return
      }
      this.logValue = data
    })
    this.selectedLogLevel = this.logLevel
  }

  private scrollDown() {
    const thisEditor: Editor = this.$refs.logEditor as Editor
    if (!thisEditor) return
    thisEditor.scrollToBottom()
  }

  private appendLine(msg: string): void {
    this.logValue = this.logValue + msg
  }

  private onLogReadErrorHandle(err: NodeJS.ErrnoException): void {
    if (err) {
      this.$log.error(err.toString())
    }
  }

  private onLogReadDataHandle(msg: Buffer): void {
    //append new buffer to logValue
    this.appendLine(msg.toString())
    this.scrollDown()
  }

  private updateLogLevel(val: LogLevel) {
    const logger = this.$logRegsity()
    logger.level = this.selectedLogLevel
    this.actionSetLogLevel({
      logLevel: val,
    })
  }

  private created() {
    this.loadData()
  }

  private mounted() {
    const LOG_DIR = getOrCreateLogDir()
    const LOG_PATH = path.join(LOG_DIR, 'log')
    watchFileAppender(LOG_PATH, this.onLogReadDataHandle, this.onLogReadErrorHandle)

    const timer = setTimeout(() => {
      this.$nextTick(() => {
        this.scrollDown()
      })
      clearTimeout(timer)
    }, 100)
  }
}
</script>

<style lang="scss">
.log-view {
  position: relative;
  padding: 0 16px;
  .titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .log-editor {
    height: 90%;
    background: var(--color-bg-normal);
    border: 1px solid var(--color-border-default);
    padding: 10px 1px 1px 1px;
    border-radius: 4px;
  }
}
</style>

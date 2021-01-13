<template>
  <div class="log-view rightbar">
    <h1 class="titlebar">
      {{ $t('log.log') }}
    </h1>
    <div class="editor-container log-editor">
      <Editor
        isCustomerLang="true"
        ref="scriptEditor"
        id="log"
        lang="logLanguage"
        v-model="logValue"
        lineNumbers="on"
        renderHighlight="line"
        disabled="true"
        :editorTheme="this.theme === 'light' ? 'editor-log' : 'editor-log-dark'"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Editor from '@/components/Editor.vue'
import { Getter } from 'vuex-class'
import log from '@/lang/log'
import fs from 'fs-extra'
import { app, remote } from 'electron'
import { getOrCreateLogDir, watchFileAppender } from '@/utils/logger'
import path from 'path'

@Component({
  components: {
    Editor,
  },
})
export default class Logs extends Vue {
  @Getter('currentTheme') private theme!: Theme

  private logValue = ''

  private async loadData(): Promise<void> {
    const LOG_DIR = getOrCreateLogDir()
    const LOG_PATH = path.join(LOG_DIR, 'log')
    fs.readFile(LOG_PATH, 'utf-8', (error, data) => {
      if (error) {
        Vue.$log.error(error.toString())
        this.$message.error(error.toString())
        return
      }
      this.logValue = data
    })
  }

  private appendLine(msg: string): void {
    this.logValue = this.logValue + msg
  }

  private onLogReadErrorHandle(err: NodeJS.ErrnoException): void {
    if (err) {
      Vue.$log.error(err.toString())
    }
  }

  private onLogReadDataHandle(msg: Buffer): void {
    //append new buffer to logValue
    this.appendLine(msg.toString())
  }

  private created() {
    this.loadData()
  }

  private mounted() {
    const LOG_DIR = getOrCreateLogDir()
    const LOG_PATH = path.join(LOG_DIR, 'log')
    watchFileAppender(LOG_PATH, this.onLogReadDataHandle, this.onLogReadErrorHandle)
  }
}
</script>

<style lang="scss">
.log-view {
  position: relative;
  padding: 0 16px;
  .titlebar {
    .el-badge_content {
      height: 20px;
      position: relative;
      top: 3px;
      margin-left: 5px;
    }
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

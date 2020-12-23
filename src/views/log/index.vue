<template>
  <div class="log-view rightbar">
    <h1 class="titlebar">
      {{ $t('log.log') }}
    </h1>
    <div class="editor-container log-editor">
      <Editor
        ref="scriptEditor"
        id="log"
        lang="json"
        v-model="logValue"
        lineNumbers="on"
        renderHighlight="line"
        disabled="true"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Editor from '@/components/Editor.vue'
import log from '@/lang/log'
import fs from 'fs-extra'
import { app, remote } from 'electron'
import chokidar from 'chokidar'
import { getlogger, getOrCreateLogDir } from '@/utils/logger'
import path from 'path'

@Component({
  components: {
    Editor,
  },
})
export default class Script extends Vue {
  private logValue = ''

  private getNewestLogFileName(LOG_PATH: string) {
    const DATEREGEXP = /log\.([0-9]*)-([0-9]*)-([0-9]*)-([0-9]*)\.log/

    const res = fs.readdirSync(LOG_PATH, {
      withFileTypes: true,
    })

    const logFileList = res
      .filter((e) => {
        const matchRes = e.name.match(DATEREGEXP)
        if (matchRes === null) {
          return false
        }
        return !e.isDirectory() && matchRes.length === 5
      })
      .map((e) => {
        return e.name
      })
    if (!logFileList.length) return false

    logFileList.sort((l, r) => {
      const lMatched = l.match(DATEREGEXP)
      const rMatched = r.match(DATEREGEXP)
      if (!lMatched || !rMatched) return 0
      for (let i = 1; i <= lMatched.length; i++) {
        const lDate = parseInt(lMatched[i])
        const rDate = parseInt(rMatched[i])
        if (lDate == rDate) {
          continue
        }
        return lDate - rDate
      }
      return 0
    })
    return logFileList[logFileList.length - 1]
  }

  private async loadData(): Promise<void> {}

  private created() {
    const logger = getlogger('logs', 'info')
    logger.info('logs page init')

    const LOG_PATH = getOrCreateLogDir()

    const watcher = chokidar.watch(LOG_PATH, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
    })
    watcher.on('add', () => {
      const newestLog = this.getNewestLogFileName(LOG_PATH)
      if (!newestLog) return
      this.logValue = fs.readFileSync(path.join(LOG_PATH, newestLog)).toString()
    })
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

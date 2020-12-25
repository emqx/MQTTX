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
      this.logValue = fs.readFileSync(path.join(LOG_PATH, 'log')).toString()
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

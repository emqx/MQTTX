<template>
  <div>
    <el-dialog
      custom-class="detail-dialog"
      :title="$t('update.updateTitle')"
      :visible.sync="showDialog"
      width="700px"
      append-to-body
      modal-append-to-body
      center
    >
      <div class="scrollable-content">
        <div ref='detail_display' class="text-content" v-html="detail" ></div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" class="update-button left-button" @click="ignoreUpdate">{{
          $t('update.ignoreVersion')
        }}</el-button>
        <div class="right-buttons">
          <el-button size="small" class="update-button" @click="nextUpdate">{{ $t('update.nextRemind') }}</el-button>
          <el-button size="small" class="update-button" type="primary" @click="toUpdate">{{
            $t('update.update')
          }}</el-button>
        </div>
      </div>
    </el-dialog>
    <el-dialog
      custom-class="progress-dialog"
      :visible.sync="progressVisible"
      :title="$t('update.downloadProgress')"
      :close-on-click-modal="false"
      :show-close="false"
      center
    >
      <div class="progress-text">{{ !downloaded ? $t('update.downloading') : $t('update.downloaded') }}</div>
      <el-progress :percentage="progress" show-text :status="downloaded ? 'success' : null"></el-progress>
      <el-button
        size="small"
        class="update-button"
        v-if="!downloaded"
        slot="footer"
        type="danger"
        @click="cancelDownload"
        >{{ $t('update.cancel') }}</el-button
      >
      <el-button size="small" class="update-button" v-else slot="footer" type="primary" @click="toInstall">{{
        $t('update.install')
      }}</el-button>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { updateChecker, versionDetail } from '@/main/updateChecker'
import { ipcRenderer } from 'electron'

const Store = require('electron-store')
const electronStore = new Store()

@Component
export default class Update extends Vue {
  @Getter('currentTheme') private theme!: Theme
  @Getter('currentLang') private getterLang!: Language
  @Getter('autoCheck') private autoCheck!: boolean
  @Ref('detail_display') private detail_display:HTMLDivElement
  private showDialog: boolean = false
  private progressVisible: boolean = false
  private version:string = ''
  private detail:string = ''
  private progress: number = 0
  private downloaded: boolean = false

  private goToLink(url: string) {
    const windowUrl = window.open(url)
    if (windowUrl) {
      windowUrl.opener = null
    }
  }

  private handleATags(){
    this.$nextTick(
      ()=>{
        const aTags = this.detail_display.getElementsByTagName('a')
        for(let a of aTags){
          a.onclick =  (e) =>{
            e.preventDefault()
            this.goToLink(a.href)
            return false;
        }
        }
      }
    )
}

  private ignoreUpdate() {
    electronStore.set('isIgnore', this.version)
    this.showDialog = false
  }

  private nextUpdate() {
    this.showDialog = false
  }

  private toUpdate() {
    this.showDialog = false
    ipcRenderer.send('startDownloadProgress', {version:this.version,detail:this.detail})
    ipcRenderer.on('downloadProgressPercent', (_, percent) => {
      let num = Math.trunc(percent)
      if (num > this.progress) {
        this.progress = num
      }
      if (num === 100) {
        this.downloaded = true
      }
    })

    this.progressVisible = true
  }

  private cancelDownload() {
    this.progressVisible = false
    ipcRenderer.send('cancelDownload')
  }

  private toInstall() {
    this.progressVisible = false
    ipcRenderer.send('toQuitAndInstall')
  }

  private async updateCheck(auto: boolean) {
    let res = await updateChecker(auto)
    if (res && typeof res !== 'boolean') {
      this.detail = res.detail
      this.version = res.version
      this.showDialog = true
      this.handleATags()
    } else if (!auto) {
      ipcRenderer.send('showMsg')
    }
  }

  private async created() {
    ipcRenderer.on('clickUpdate', (event) => {
      this.updateCheck(false)
    })
    if (this.autoCheck) {
      await this.updateCheck(true)
    }
  }

}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';

.detail-dialog,
.progress-dialog {
  .el-dialog__header {
    padding: 0 20px;
    line-height: 56px;
    border-bottom: 1px solid var(--color-border-default);
    .el-dialog__title {
      color: var(--color-text-title);
      font-size: $font-size--subtitle;
    }
  }
  .el-dialog--center .el-dialog__body {
    padding: 32px 24px 0;
  }
  .el-dialog__footer {
    padding: 10px 24px;
    .el-button--text {
      font-size: 14px;
      color: var(--color-text-default);
      &:hover {
        color: var(--color-main-green);
      }
    }
  }
  .update-button {
    border-radius: 8px;
  }
}

.detail-dialog {
  overflow-y: auto;
  max-height: 400px;
  .el-dialog__footer {
    text-align: right;
  }
  .scrollable-content {
    height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .text-content {
    padding: 10px;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    color: var(--color-text-title);
    .icon.icon-link {
      display: none;
    }
    h1 {
      font-size: 2.2rem;
      &:first-child {
        margin-top: 0;
        padding-top: 0;
      }
    }
    h2 {
      font-size: 1.65rem;
      padding-bottom: 0.3rem;
      border-bottom: 1px solid #eaecef;
    }
    h3 {
      font-size: 1.35rem;
    }
    h1,
    h2,
    h3,
    h4 {
      color: var(--color-text-title);
      line-height: 1.25;
      font-weight: 600;
      margin-top: -3.1rem;
      padding-top: 4.6rem;
      margin-bottom: 0;
    }
    ol,
    p,
    ul {
      line-height: 1.4;
      margin: 1rem 0;
    }
    code {
      font-family: source-code-pro, Menlo, Monaco, Consolas, Courier New, monospace;
      color: var(--color-main-green);
      padding: 0.25rem 0.5rem;
      margin: 0;
      font-size: 0.85em;
      font-weight: 600;
      background-color: #1b1f230d;
      border-radius: 3px;
    }
    pre,
    pre[class*='language-'] {
      line-height: 1.4;
      padding: 1.25rem 1.5rem;
      margin: 0.85rem 0;
      background-color: #282c34;
      border-radius: 6px;
      overflow: auto;
      text-shadow: none;
      code {
        color: #fff;
        padding: 0;
        background-color: transparent;
        border-radius: 0;
      }
      .number {
        display: unset;
        background-color: initial;
        border-radius: initial;
        font-size: 14px;
        height: auto;
        margin-right: initial;
        min-width: initial;
        padding: initial;
        color: #cc99cd;
        text-align: unset;
        vertical-align: unset;
      }
    }
    a {
      color: #00b173;
      font-weight: 500;
      word-break: break-word;
      // pointer-events: none;
    }
    ul {
      list-style: disc;
      padding-left: 1.2em;
    }
    ol {
      list-style: decimal;
      padding-left: 1.2em;
    }
    table {
      border-collapse: collapse;
      margin: 1rem 0;
      display: block;
      overflow-x: auto;
    }
    tr {
      border-top: 1px solid #dfe2e5;
    }
    td,
    th {
      border: 1px solid #dfe2e5;
      padding: 0.6em 1em;
    }
    tr:nth-child(2n) {
      background-color: #f6f8fa;
    }

    article {
      margin: 0 40px;
    }
    blockquote {
      background-color: transparent;
      border-color: #42b983;
      padding: 0.1rem 1.5rem;
      border-left-width: 0.5rem;
      border-left-style: solid;
      margin: 1rem 0;
    }
    .language-css .token.string,
    .style .token.string,
    .token.entity,
    .token.operator,
    .token.url {
      background-color: transparent;
    }
    .table-content {
      position: sticky;
      top: 80px;
      max-width: 200px;
      .title {
        color: #a0aec0;
        margin-bottom: 0.5rem;
        font-size: 14px;
        line-height: 1rem;
        --text-opacity: 1;
      }
      .item {
        font-size: 14px;
        &.depth-2 {
          padding-bottom: 8px;
          padding-top: 8px;
          border-top: 1px dashed #e2e8f0;
        }
        &.depth-3 {
          padding-bottom: 6px;
          padding-top: 6px;
          margin-left: 12px;
        }
        a {
          color: #4a5568;
          &.is-active,
          &:hover {
            color: #00b173;
          }
        }
      }
    }
  }
  .dialog-footer {
    display: flex;
    justify-content: space-between;

    .left-button {
      order: -1;
    }
    .right-buttons {
      display: flex;
      gap: 8px;
    }
  }
}
.progress-dialog {
  .progress-text {
    color: var(--color-text-title);
  }
  .el-dialog__footer {
    text-align: center;
  }
}
</style>

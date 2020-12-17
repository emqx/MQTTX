<template>
  <my-dialog
    :title="$t('script.script')"
    :visible.sync="showDialog"
    class="use-script"
    width="400px"
    @close="resetData"
    @confirm="save"
    @keyupEnter="save"
  >
    <router-link class="new-script-btn" to="/script">
      <i class="iconfont icon-plus"></i>
    </router-link>
    <el-form ref="form" label-position="left" label-width="120px">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('script.scriptName')" prop="currentScriptId">
            <el-select size="small" v-model="currentScriptId">
              <el-option v-for="script in scripts" :key="script.id" :value="script.id" :label="script.name">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="$t('script.applyType')" prop="scriptApply">
            <el-select size="small" v-model="scriptApply">
              <el-option v-for="(apply, index) in applyOption" :key="index" :value="apply.value" :label="apply.label">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { loadScript, loadScripts } from '@/api/script'
import MyDialog from './MyDialog.vue'
import { ScriptModel } from '@/views/script/types'
import { MessageType } from '@/views/connections/types'

@Component({
  components: {
    MyDialog,
  },
})
export default class UseScript extends Vue {
  @Prop({ default: false }) public visible!: boolean

  private showDialog: boolean = this.visible
  private scripts: ScriptModel[] = []
  private currentScriptId: string = ''
  private scriptApply: MessageType = 'received'
  private applyOption = [
    {
      label: this.$t('connections.all'),
      value: 'all',
    },
    {
      label: this.$t('connections.received'),
      value: 'received',
    },
    {
      label: this.$t('connections.published'),
      value: 'publish',
    },
  ]

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private created() {
    this.loadData()
  }

  private async loadData() {
    const scripts: ScriptModel[] = await loadScripts()
    this.scripts = scripts
  }

  private resetData() {
    this.$emit('update:visible', false)
  }

  private async save() {
    if (!this.currentScriptId) {
      this.$message.warning(this.$t('script.scriptRequired') as string)
      return
    }
    const currentScript = await loadScript(this.currentScriptId)
    if (currentScript) {
      this.$emit('setScript', currentScript, this.scriptApply)
      this.resetData()
    }
  }
}
</script>

<style lang="scss">
.use-script {
  .new-script-btn {
    position: absolute;
    top: 17px;
    left: 70px;
    i {
      font-size: 14px;
    }
  }
}
</style>

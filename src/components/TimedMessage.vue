<template>
  <my-dialog
    :title="$t('connections.timedMessage')"
    :visible.sync="showDialog"
    class="timed-message"
    width="340px"
    @confirm="publishTimedMsg"
    @close="resetData"
  >
    <el-form ref="form" label-position="left" label-width="160px" :model="record" size="small">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('connections.msgFrequency')">
            <el-input-number v-model="record.sendFrequency" controls-position="right" :min="1"> </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import MyDialog from './MyDialog.vue'

interface TimedForm {
  sendFrequency: number | undefined
}

@Component({
  components: {
    MyDialog,
  },
})
export default class TimedMessage extends Vue {
  @Prop({ default: false }) public visible!: boolean

  private showDialog: boolean = this.visible
  public record: TimedForm = {
    sendFrequency: undefined,
  }

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private publishTimedMsg() {
    const { sendFrequency } = this.record
    if (sendFrequency) {
      this.$emit('setTimerSuccess', sendFrequency)
      this.$message.success(this.$t('connections.setTimerSuccess') as string)
    }
    this.resetData()
  }

  private resetData() {
    this.showDialog = false
    this.$emit('update:visible', false)
  }
}
</script>

<style lang="scss">
.timed-message {
  .el-input-number--small {
    width: 100%;
  }
}
</style>

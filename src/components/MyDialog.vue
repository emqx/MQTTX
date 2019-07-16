<template>
  <el-dialog
    class="my-dialog"
    :append-to-body="true"
    :show-close="false"
    :center="true"
    :visible.sync="showDialog"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @open="open"
    @close="close">

    <slot></slot>

    <div slot="footer" class="dialog-footer">
      <el-button class="cancel" type="text" size="small" @click="hideDialog">
        {{ $t('myDialog.cancel') }}
      </el-button>
      <el-button
        class="confirm-button"
        type="text"
        :loading="confirmLoading"
        :disabled="btnDisabled"
        @click="confirmClick">{{ $t('myDialog.confirm') }}
      </el-button>
    </div>

  </el-dialog>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class MyDialog extends Vue {
  // The title name to display
  @Prop({ required: true }) public title!: string
  // The width of the dialog
  @Prop({ default: '400px' }) public width!: string
  // Show dialog
  @Prop({ default: false }) public visible!: boolean
  // Confirm button loading
  @Prop({ default: false }) public confirmLoading!: boolean
  // Confirm button disabled status
  @Prop({ default: false }) public btnDisabled!: boolean

  private showDialog: boolean =  this.visible

  @Watch('visible')
  private onChildChanged(val: boolean, oldVal: boolean) {
    this.showDialog = val
  }

  private confirmClick(): void {
    // Confirm event
    this.$emit('confirm')
  }
  private open(): void {
    // Open the dialog event
    this.$emit('open')
  }
  private close(): void {
    this.$emit('update:visible', false)
    // Close the dialog event
    this.$emit('close')
  }
  private hideDialog(): void {
    // Hide the Dialog event
    this.$emit('update:visible', false)
  }
}
</script>


<style lang="scss">
@import "~@/assets/scss/variable.scss";

.my-dialog {
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
    padding: 8px 24px 0;
    .el-form-item__label {
      color: var(--color-text-default)
    }
    .el-form-item {
      margin-bottom: 8px;
    }
  }
  .el-dialog__footer {
    padding: 10px;
    .el-button--text {
      font-size: 14px;
      color: var(--color-text-default);
      &:hover {
        color: var(--color-main-green);
      }
    }
    .confirm-button {
      color: var(--color-main-green);
    }
  }
}
</style>

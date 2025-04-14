<template>
  <div class="copilot-header clearfix">
    <span>MQTTX Copilot <el-tag size="mini" type="info">Beta</el-tag></span>
    <div>
      <el-button type="text" @click="clearAllMessages"><i class="el-icon-plus"></i></el-button>
      <el-button type="text" @click="toggleWindow"><i class="el-icon-close"></i></el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class CopilotHeader extends Vue {
  private clearAllMessages() {
    this.$emit('clear-all-messages')
  }

  private toggleWindow() {
    this.$emit('toggle-window')
  }
}
</script>

<style lang="scss">
.copilot-header {
  position: relative;
  z-index: 10;
  -webkit-app-region: no-drag;

  &.clearfix {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .el-button--text {
      padding: 0;
      i {
        font-size: 16px;
        color: var(--color-text-title);
        font-weight: 400;
      }
    }
  }

  .el-tag {
    margin-left: 8px;
  }
}
</style>

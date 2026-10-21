<template>
  <div class="message-viewer-header">
    <el-tooltip
      :effect="theme !== 'light' ? 'light' : 'dark'"
      placement="bottom"
      :open-delay="openDelay"
      :content="$t('viewer.olderMessage')"
    >
      <i class="nav-icon nav-left" :class="{ 'is-disabled': previousDisabled }" @click="$emit('previous')">
        <i class="el-icon-arrow-left"></i>
      </i>
    </el-tooltip>
    <slot></slot>
    <div class="nav-right">
      <el-tooltip
        :effect="theme !== 'light' ? 'light' : 'dark'"
        placement="bottom"
        :open-delay="openDelay"
        :content="$t('viewer.newerMessage')"
      >
        <i class="nav-icon" :class="{ 'is-disabled': nextDisabled }" @click="$emit('next')">
          <i class="el-icon-arrow-right"></i>
        </i>
      </el-tooltip>
      <el-tooltip
        :effect="theme !== 'light' ? 'light' : 'dark'"
        placement="bottom"
        :open-delay="openDelay"
        :content="$t('viewer.goToLatestMessage')"
      >
        <i class="nav-icon" :class="{ 'is-disabled': latestDisabled }" @click="$emit('latest')">
          <i class="el-icon-d-arrow-right"></i>
        </i>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'

@Component
export default class MessageViewerHeader extends Vue {
  @Prop({ type: Boolean, default: false }) private previousDisabled!: boolean
  @Prop({ type: Boolean, default: false }) private nextDisabled!: boolean
  @Prop({ type: Boolean, default: false }) private latestDisabled!: boolean
  @Getter('currentTheme') private theme!: Theme

  private openDelay = 500
}
</script>

<style lang="scss" scoped>
.message-viewer-header {
  display: flex;
  border-bottom: 1px solid var(--color-border-default);
  background: var(--color-bg-primary);

  .nav-icon {
    width: 40px;
    height: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-title);
    background: var(--color-bg-normal);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;

    &:hover {
      background: var(--color-main-green);
      color: #fff;
    }

    &.is-disabled {
      opacity: 0.25;
      cursor: not-allowed;
      pointer-events: none;
      background: transparent;
    }

    &.nav-left {
      border-right: 1px solid var(--color-border-default);
    }
  }

  .nav-right {
    display: flex;
    align-items: stretch;
    border-left: 1px solid var(--color-border-default);

    .nav-icon {
      height: auto;
      border-left: 1px solid var(--color-border-default);

      &:first-child {
        border-left: none;
      }
    }
  }
}
</style>

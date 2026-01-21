<template>
  <div class="leftbar">
    <section class="leftbar-top">
      <div class="app-logo leftbar-item">
        <a :href="siteLink" target="_blank" rel="noopener noreferrer">
          <img src="../assets/images/app-logo.png" alt="app-logo" />
        </a>
      </div>
      <div :class="[{ active: isConnection }, 'leftbar-item']">
        <a href="javascript:;" @click="routeToPage('/recent_connections')">
          <i class="iconfont icon-connections"></i>
        </a>
      </div>
      <div :class="[{ active: isCreate }, 'leftbar-item']">
        <a href="javascript:;" @click="routeToPage('/recent_connections/0?oper=create')">
          <i class="iconfont icon-new"></i>
        </a>
      </div>
    </section>

    <section class="leftbar-bottom">
      <div :class="[{ active: isSettings }, 'leftbar-item']">
        <a href="javascript:;" @click="routeToPage('/settings')">
          <i class="iconfont icon-settings"></i>
        </a>
      </div>
      <div :class="[{ active: isHelp }, 'leftbar-item']">
        <a href="javascript:;" @click="routeToPage('/help')">
          <i class="iconfont icon-mqtt"></i>
        </a>
      </div>
      <div :class="[{ active: isAbout }, 'leftbar-item']">
        <a href="javascript:;" @click="routeToPage('/about')">
          <i class="iconfont icon-about"></i>
        </a>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'

@Component
export default class Leftbar extends Vue {
  @Getter('currentLang') private getterLang!: Language

  get siteLink(): string {
    return this.getterLang === 'zh' ? 'https://mqttx.app/zh' : 'https://mqttx.app/'
  }
  get isConnection(): boolean {
    return ['Connections', 'ConnectionDetails'].includes(this.$route.name || '') && this.$route.query.oper !== 'create'
  }
  get isCreate(): boolean {
    return this.$route.name === 'ConnectionDetails' && this.$route.query.oper === 'create'
  }
  get isSettings(): boolean {
    return this.$route.path === '/settings'
  }
  get isAbout(): boolean {
    return this.$route.path === '/about'
  }
  get isHelp(): boolean {
    return this.$route.path === '/help'
  }

  private routeToPage(path: string) {
    this.$router
      .push({
        path,
      })
      .catch(() => {})
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';

@keyframes glow-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
  50% {
    box-shadow: 0 0 12px 2px rgba(16, 185, 129, 0.3);
  }
}

.leftbar {
  position: fixed;
  width: 76px;
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, var(--color-bg-leftbar_top) 0%, var(--color-bg-leftbar_bottom) 100%);
  padding: 40px 0 24px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  -webkit-app-region: drag;
  border-right: 1px solid rgba(255, 255, 255, 0.05);

  & > .leftbar-top {
    flex: 3;
  }
  & > .leftbar-bottom {
    flex: 0;
  }

  .leftbar-item {
    text-align: center;
    margin-bottom: 12px;
    position: relative;
    a {
      height: 44px;
      width: 44px;
      line-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      &::before {
        content: '';
        position: absolute;
        left: -12px;
        top: 50%;
        transform: translateY(-50%) scaleY(0);
        width: 3px;
        height: 20px;
        background: var(--color-main-green);
        border-radius: 0 2px 2px 0;
        transition: transform 0.2s ease;
      }
    }
    &.active a {
      background: linear-gradient(135deg, var(--color-bg-leftbar_item) 0%, rgba(16, 185, 129, 0.15) 100%);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      &::before {
        transform: translateY(-50%) scaleY(1);
      }
      .iconfont {
        color: var(--color-main-green);
      }
    }
    a:hover {
      background: var(--color-bg-leftbar_item);
      transform: scale(1.05);
      .iconfont {
        color: var(--color-main-white);
      }
    }
    &:last-child {
      margin-bottom: 0px;
    }
  }

  .app-logo {
    margin-bottom: 72px;
    a {
      &:hover {
        background: transparent;
        transform: none;
      }
    }
    img {
      width: 36px;
      height: 36px;
      transition: transform 0.3s ease;
      &:hover {
        transform: rotate(10deg) scale(1.1);
      }
    }
  }

  .iconfont {
    color: var(--color-text-leftbar_icon);
    transition: color 0.2s ease;
  }
  .leftbar-top .iconfont {
    font-size: 22px;
  }
  .leftbar-bottom .iconfont {
    font-size: 18px;
  }

  @media (min-width: 1920px) {
    width: 116px;
  }
}
</style>

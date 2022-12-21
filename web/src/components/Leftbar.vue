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

.leftbar {
  position: fixed;
  width: 80px;
  top: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--color-bg-leftbar_top) 0%, var(--color-bg-leftbar_bottom) 100%);
  padding: 45px 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  -webkit-app-region: drag;

  & > .leftbar-top {
    flex: 3;
  }
  & > .leftbar-bottom {
    flex: 0;
  }

  .leftbar-item {
    text-align: center;
    margin-bottom: 25px;
    position: relative;
    a {
      height: 48px;
      width: 48px;
      line-height: 48px;
      display: inline-block;
    }
    &.active a {
      background-color: var(--color-bg-leftbar_item);
      border-radius: 8px;
    }
    &.active a,
    a:hover {
      .iconfont {
        color: var(--color-main-white);
      }
    }
    &:last-child {
      margin-bottom: 0px;
    }
  }

  .app-logo {
    margin-bottom: 35px;
    img {
      width: 40px;
      height: 40px;
    }
  }

  .iconfont {
    color: var(--color-text-light);
  }
  .leftbar-top .iconfont {
    font-size: 24px;
  }
  .leftbar-bottom .iconfont {
    font-size: 20px;
  }

  @media (min-width: 1920px) {
    width: 120px;
  }
}
</style>

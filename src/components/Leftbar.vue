<template>
  <div class="leftbar">
    <div class="app-logo leftbar-top leftbar-item">
      <a :href="siteLink" target="_blank" rel="noopener noreferrer">
        <img src="../assets/images/app-logo.png" alt="app-logo" />
      </a>
    </div>
    <section class="leftbar-center">
      <template v-if="!isNewWindow">
        <div :class="[{ active: isConnection }, 'leftbar-item']">
          <a href="javascript:;" @click="routeToPage('/recent_connections')">
            <i class="iconfont icon-connect"></i>
          </a>
        </div>
        <div class="leftbar-item">
          <a href="javascript:;" @click="routeToPage('/recent_connections/0?oper=create')">
            <i class="iconfont icon-new"></i>
          </a>
        </div>
        <div :class="[{ active: isScript }, 'leftbar-item']">
          <a href="javascript:;" @click="routeToPage('/script')">
            <i class="iconfont icon-script"></i>
          </a>
        </div>
        <div :class="[{ active: isLog }, 'leftbar-item']">
          <a href="javascript:;" @click="routeToPage('/log')">
            <i class="iconfont icon-log"></i>
          </a>
        </div>
      </template>
    </section>

    <section v-if="!isNewWindow" class="leftbar-bottom">
      <div :class="[{ active: isAbout }, 'leftbar-item']">
        <a href="javascript:;" @click="routeToPage('/about')">
          <i class="iconfont icon-about"></i>
        </a>
      </div>
      <div :class="[{ active: isSettings }, 'leftbar-item']">
        <a href="javascript:;" @click="routeToPage('/settings')">
          <i class="iconfont icon-settings"></i>
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
    const link = 'https://mqttx.app/'
    return this.getterLang === 'zh' ? `${link}/zh` : link
  }
  get isConnection(): boolean {
    return 'recent_connections' === this.$route.path.split('/')[1]
  }
  get isSettings(): boolean {
    return this.$route.path === '/settings'
  }
  get isAbout(): boolean {
    return this.$route.path === '/about'
  }
  get isScript(): boolean {
    return this.$route.path === '/script'
  }
  get isLog(): boolean {
    return this.$route.path === '/log'
  }
  get isNewWindow(): boolean {
    return this.$route.name === 'newWindow'
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
    flex: 1;
  }
  & > .leftbar-center {
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
        color: var(--color-bg-normal);
      }
    }
    &:last-child {
      margin-bottom: 0px;
    }
  }

  .app-logo {
    img {
      width: 40px;
      height: 40px;
    }
  }

  .iconfont {
    color: var(--color-text-leftbar_icon);
  }
  .leftbar-center .iconfont {
    font-size: 24px;
  }
  .leftbar-bottom .iconfont {
    font-size: 20px;
  }
}
</style>

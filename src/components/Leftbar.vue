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
      <div class="leftbar-item">
        <a href="javascript:;" @click="routeToPage('/recent_connections/0?oper=create')">
          <i class="iconfont icon-plus"></i>
        </a>
      </div>
    </section>

    <section class="leftbar-bottom">
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
    return this.getterLang === 'zh' ? `${link}/cn` : link
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
  background: var(--color-bg-leftbar);
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
      border-radius: 50%;
    }
    &.active a,
    a:hover {
      .iconfont {
        color: var(--color-main-green);
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
    font-size: $font-size--leftbar_title;
  }
}
</style>

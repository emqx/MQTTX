<template>
  <div class="leftbar">
    <div class="app-logo leftbar-top leftbar-item">
      <a :href="siteLink" target="_blank" rel="noopener noreferrer">
        <img src="@/assets/images/app-logo.png" alt="app-logo" />
      </a>
    </div>
    <section v-if="!isNewWindow" class="leftbar-center">
      <div v-for="item in menuItems" :key="item.path" :class="['leftbar-item', { active: isActive(item) }]">
        <a href="javascript:;" @click="routeToPage(item.path, item.query)">
          <i :class="['iconfont', item.icon]"></i>
        </a>
      </div>
    </section>
    <section v-if="!isNewWindow" class="leftbar-bottom">
      <div v-for="item in bottomItems" :key="item.path" :class="['leftbar-item', { active: isActive(item) }]">
        <a href="javascript:;" @click="routeToPage(item.path)">
          <i :class="['iconfont', item.icon]"></i>
        </a>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import gaCustomLinks from '@/utils/gaCustomLinks'

interface MenuItem {
  path: string
  icon: string
  name?: string
  query?: { [key: string]: string }
}

@Component
export default class Leftbar extends Vue {
  @Getter('currentLang') private getterLang!: Language

  private menuItems: MenuItem[] = [
    { path: '/recent_connections', icon: 'icon-connections', name: 'Connections' },
    { path: '/recent_connections/0', icon: 'icon-new', query: { oper: 'create' }, name: 'ConnectionDetails' },
    { path: '/viewer', icon: 'icon-tree-view' },
    { path: '/script', icon: 'icon-script' },
    { path: '/log', icon: 'icon-log' },
  ]

  private bottomItems: MenuItem[] = [
    { path: '/settings', icon: 'icon-settings' },
    { path: '/help', icon: 'icon-mqtt' },
    { path: '/about', icon: 'icon-about' },
  ]

  get siteLink(): string {
    return gaCustomLinks(this.getterLang).leftBarLogo
  }

  get isNewWindow(): boolean {
    return this.$route.name === 'newWindow'
  }

  private isActive(item: MenuItem): boolean {
    if (item.name === 'Connections' || item.name === 'ConnectionDetails') {
      return (
        ['Connections', 'ConnectionDetails'].includes(this.$route.name || '') &&
        (item.name === 'Connections' ? this.$route.query.oper !== 'create' : this.$route.query.oper === 'create')
      )
    }
    if (item.path === '/viewer') {
      return this.$route.path.startsWith('/viewer')
    }
    return this.$route.path === item.path
  }

  private routeToPage(path: string, query?: { [key: string]: string }) {
    this.$router.push({ path, query }).catch(() => {})
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
    flex: 4;
  }
  & > .leftbar-bottom {
    flex: 0;
  }
  .leftbar-item {
    text-align: center;
    margin-bottom: 20px;
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

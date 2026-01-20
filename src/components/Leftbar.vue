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
  a {
    -webkit-app-region: no-drag;
  }
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
    margin-bottom: 16px;
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
  .leftbar-center .iconfont {
    font-size: 22px;
  }
  .leftbar-bottom .iconfont {
    font-size: 18px;
  }
}
</style>

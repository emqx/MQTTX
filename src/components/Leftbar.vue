<template>
  <div class="leftbar">
    <div class="app-logo leftbar-top leftbar-item">
      <a :href="siteLink" target="_blank" rel="noopener noreferrer">
        <img src="@/assets/images/app-logo.png" alt="app-logo" />
      </a>
    </div>
    <section class="leftbar-center">
      <template v-if="!isNewWindow">
        <div :class="[{ active: isConnection }, 'leftbar-item']">
          <a href="javascript:;" @click="routeToPage('/recent_connections')">
            <i class="iconfont icon-connect"></i>
          </a>
        </div>
        <div :class="[{ active: isCreate }, 'leftbar-item']">
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
      <div :class="[{ active: isSettings }, 'leftbar-item']">
        <a href="javascript:;" @click="routeToPage('/settings')">
          <i class="iconfont icon-settings"></i>
        </a>
      </div>
      <el-popover
        ref="popover"
        popper-class="leftbar-tooltip"
        placement="right"
        width="120"
        trigger="manual"
        v-model="visible"
      >
        <div class="popover-centent" @click="visible = !visible">
          <div class="leftbar-item" @click="routeToPage('/about')">
            {{ $t('about.about') }}
          </div>
          <div class="leftbar-item" @click="routeToPage('/help')">
            {{ $t('help.help') }}
          </div>
        </div>
      </el-popover>
      <div
        :class="[{ active: isAbout || isHelp }, 'leftbar-item']"
        v-popover:popover
        @click="visible = !visible"
        v-click-outside="() => (visible = false)"
      >
        <a href="javascript:;">
          <i class="iconfont icon-help"></i>
        </a>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import ClickOutside from 'vue-click-outside'
import gaCustomLinks from '@/utils/gaCustomLinks'

@Component({
  directives: {
    ClickOutside,
  },
})
export default class Leftbar extends Vue {
  @Getter('currentLang') private getterLang!: Language

  private visible: boolean = false

  get siteLink(): string {
    return gaCustomLinks(this.getterLang).leftBarLogo
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
  get isScript(): boolean {
    return this.$route.path === '/script'
  }
  get isLog(): boolean {
    return this.$route.path === '/log'
  }
  get isNewWindow(): boolean {
    return this.$route.name === 'newWindow'
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

<style lang="scss">
.leftbar-tooltip[x-placement^='right'] {
  color: var(--color-bg-normal);
  padding: 0;
  background: linear-gradient(135deg, var(--color-bg-leftbar_top) 0%, var(--color-bg-leftbar_bottom) 100%) !important;
  text-align: center;
  border-radius: 8px;
  .popper__arrow::after {
    border-right-color: var(--color-bg-leftbar_top) !important;
  }
  .popover-centent {
    overflow: hidden;
    border-radius: 8px;
  }
  .leftbar-item {
    cursor: pointer;
    line-height: 40px;
    color: var(--color-text-active);
    &:hover {
      background-color: var(--color-bg-leftbar_item);
    }
  }
}
</style>

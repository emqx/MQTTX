<template>
  <DatabaseError v-if="connectDatabaseFailMessage" />
  <div class="home-view" v-else>
    <Leftbar />
    <RouterView />
    <Ipc @setTheme="setTheme" @setLang="setLang" />
    <Update v-if="updateActive" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { remote } from 'electron'
import Ipc from '@/components/Ipc.vue'
import Leftbar from '@/components/Leftbar.vue'
import DatabaseError from '@/components/DatabaseError.vue'

@Component({
  components: {
    Ipc,
    Leftbar,
    Update: () => import('@/views/update/index.vue'),
    DatabaseError,
  },
})
export default class Home extends Vue {
  @Getter('currentTheme') private getterTheme!: Theme
  @Getter('currentLang') private getterLang!: Language
  @Getter('syncOsTheme') private syncOsTheme!: boolean
  @Getter('connectDatabaseFailMessage') private connectDatabaseFailMessage!: string
  @Action('TOGGLE_THEME') private actionTheme!: (payload: { currentTheme: string }) => void
  @Action('TOGGLE_LANG') private actionLang!: (payload: { currentLang: string }) => void
  private updateActive: boolean = false

  private setTheme(theme: Theme): void {
    const { shouldUseDarkColors } = remote.nativeTheme
    let currentTheme = theme
    if (this.syncOsTheme) {
      currentTheme = shouldUseDarkColors ? 'night' : 'light'
    }
    const bodyTag: HTMLBodyElement | null = document.querySelector('body')
    if (!bodyTag) {
      return
    }
    bodyTag.className = currentTheme
    this.actionTheme({ currentTheme })
  }

  private setLang(currentLang: Language): void {
    document.documentElement.lang = currentLang
    this.$i18n.locale = currentLang
    this.actionLang({ currentLang })
  }

  private created() {
    this.setTheme(this.getterTheme)
    this.setLang(this.getterLang)
    setTimeout(() => {
      this.updateActive = true
    }, 3000)
  }
}
</script>

<style lang="scss" scope>
@import '~@/assets/scss/mixins.scss';

.home-view {
  height: 100%;
  background-color: var(--color-bg-primary);
  .topbar {
    @include flex-space-between;
    min-height: 60px;
    padding: 0 16px;
    border-bottom: 1px solid var(--color-border-default);
  }
  .right-topbar {
    position: fixed;
    right: 0;
    z-index: 2;
    background: var(--color-bg-normal);
    transition: all 0.4s;
  }
  .rightbar {
    margin-left: 81px;
    height: 100%;
    background-color: var(--color-bg-primary);
    border-left: 1px solid var(--color-border-rightbar);
  }
  .right-content {
    height: 100%;
    background-color: var(--color-bg-primary);
  }
}
</style>

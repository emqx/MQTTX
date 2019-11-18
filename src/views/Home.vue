<template>
  <div class="home-view">
    <RouterView/>
    <Ipc @setTheme="setTheme" @setLang="setLang"/>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import Ipc from '@/components/Ipc.vue'

@Component({
  components: {
    Ipc,
  },
})
export default class Home extends Vue {
  @Getter('currentTheme') private getterTheme!: 'dark' | 'light'
  @Getter('currentLang') private getterLang!: 'en' | 'zh'

  private setTheme(currentTheme: 'dark' | 'light'): void {
    const bodyTag: HTMLBodyElement | null = document.querySelector('body')
    if (!bodyTag) {
      return
    }
    bodyTag.className = currentTheme
  }

  private setLang(currentLang: 'en' | 'zh'): void {
    document.documentElement.lang = currentLang
    this.$i18n.locale = currentLang
  }

  private created() {
    this.setTheme(this.getterTheme)
    this.setLang(this.getterLang)
  }
}
</script>


<style lang="scss" scope>
@import '~@/assets/scss/mixins.scss';

.home-view {
  min-height: 100%;
  background-color: var(--color-bg-primary);
  .topbar {
    @include flex-space-between;
    min-height: 60px;
    border-bottom: 1px solid var(--color-border-default);
  }
  .left-topbar {
    padding: 0 16px;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1;
    background: var(--color-bg-normal);
    width: 280px;
    border-right: 2px solid var(--color-border-default);
  }
  .right-topbar {
    position: fixed;
    top: 0;
    left: 280px;
    right: 0;
    z-index: 3;
    background: var(--color-bg-normal);
  }
  .right-content {
    margin-left: 280px;
    min-height: 100%;
  }
}
</style>

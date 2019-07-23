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
  @Getter('currentTheme') private getterTheme: any
  @Getter('currentLang') private getterLang: any

  private setTheme(currentTheme: string): void {
    const bodyTag: HTMLBodyElement | null = document.querySelector('body')
    if (!bodyTag) {
      return
    }
    bodyTag.className = currentTheme
  }

  private setLang(currentLang: string): void {
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
    height: 60px;
    border-bottom: 1px solid var(--color-border-default);
  }
  .left-topbar {
    padding: 0 16px;
  }
  .right-topbar {
    position: fixed;
    top: 0;
    left: 300px;
    right: 0;
    z-index: 3;
  }
  .right-content {
    margin-left: 300px;
    min-height: 100%;
  }
}
</style>

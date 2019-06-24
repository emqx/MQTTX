<template>
  <div>
    <leftbar/>
    <div class="settings-view right-content">
      <el-select v-model="currentLang" @change="handleSelectChange('lang', $event)">
        <el-option value="zh"></el-option>
        <el-option value="en"></el-option>
      </el-select>
       <el-select v-model="currentTheme" @change="handleSelectChange('theme', $event)">
        <el-option value="light"></el-option>
        <el-option value="dark"></el-option>
      </el-select>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { ipcRenderer } from 'electron'
import Leftbar from '@/components/Leftbar.vue'

@Component({
  components: {
    Leftbar,
  },
})
export default class Settings extends Vue {
  @Action('TOGGLE_THEME') private actionTheme: any
  @Action('TOGGLE_LANG') private actionLang: any
  @Getter('currentTheme') private getterTheme: any
  @Getter('currentLang') private getterLang: any

  private currentTheme: string = 'light'
  private currentLang: string = 'en'

  private handleSelectChange(type: string, value: string | number | boolean): void {
    if (type === 'theme') {
      this.actionTheme({ currentTheme: value })
    } else if (type === 'lang') {
      this.actionLang({ currentLang: value })
    }
    ipcRenderer.send('setting', type, value)
  }

  private created() {
    this.currentTheme = this.getterTheme
    this.currentLang = this.getterLang
  }
}
</script>


<style lang="scss">
.settings-view {
  .titlebar {
    height: 60px;
  }
}
</style>

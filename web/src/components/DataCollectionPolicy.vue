<template>
  <my-dialog
    :title="$t('about.dataCollectionPolicy')"
    class="data-collection-policy-dialog"
    :visible.sync="showDialog"
    width="540px"
    @confirm="handleClose"
    @close="handleClose"
  >
    <div v-html="renderedContent" class="data-collection-policy-dialog__content"></div>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import MyDialog from './MyDialog.vue'
import markdownit from 'markdown-it'

@Component({
  components: {
    MyDialog,
  },
})
export default class Leftbar extends Vue {
  @Getter('currentLang') private getterLang!: Language

  @Prop({ default: false }) public visible!: boolean

  private showDialog: boolean = this.visible
  private renderedContent: string = ''

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  @Watch('getterLang')
  private onLangChanged() {
    this.loadAndRenderMarkdown()
  }

  private handleClose() {
    this.showDialog = false
    this.$emit('update:visible', false)
  }

  private async loadAndRenderMarkdown() {
    const md = markdownit()
    try {
      const markdownFile = require(`@/assets/doc/policy/data-collection-${this.getterLang}.md`)
      this.renderedContent = md.render(markdownFile.default)
    } catch (error) {
      console.error('Error loading the markdown file:', error)
    }
  }

  private mounted() {
    this.loadAndRenderMarkdown()
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';

.data-collection-policy-dialog {
  .dialog-footer .cancel {
    display: none;
  }
  &__content {
    color: var(--color-text-default);
    h1 {
      margin-bottom: 24px;
    }
  }
}
</style>

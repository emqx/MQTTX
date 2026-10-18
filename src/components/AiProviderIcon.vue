<template>
  <span v-if="asset && asset.mono" class="ai-provider-icon mono" :style="monoStyle"></span>
  <img v-else-if="asset" class="ai-provider-icon" :src="asset.src" alt="" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { resolveProviderIcon } from '@/utils/ai/providerIcons'

/**
 * Brand icon of an AI provider, or of a model's series when the model id belongs to one.
 *
 * Brands that only publish a monochrome logo (OpenAI, xAI, Groq, Vercel, Moonshot, Anthropic, Z.AI)
 * are drawn with a CSS mask filled by `currentColor`, so they follow the surrounding text colour in
 * every theme instead of staying black.
 */
@Component
export default class AiProviderIcon extends Vue {
  @Prop({ default: '' }) private provider!: string
  @Prop({ default: '' }) private model!: string

  private get asset() {
    return resolveProviderIcon(this.provider, this.model || undefined)
  }

  private get monoStyle(): Record<string, string> {
    const mask = `url(${this.asset?.src})`
    return { maskImage: mask, WebkitMaskImage: mask }
  }
}
</script>

<style lang="scss" scoped>
.ai-provider-icon {
  display: inline-block;
  flex: none;
  width: 16px;
  height: 16px;
  vertical-align: middle;
  object-fit: contain;

  &.mono {
    background-color: currentColor;
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: contain;
    -webkit-mask-position: center;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: contain;
  }
}
</style>

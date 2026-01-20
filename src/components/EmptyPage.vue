<template>
  <div
    class="empty-page right-content"
    :style="{
      marginLeft: leftValue,
    }"
  >
    <div class="empty-page__block">
      <div>
        <img :src="imageSrc" alt="new connection" />
      </div>
      <el-button class="primary-btn" icon="el-icon-plus" @click="clickMethod(false)">
        {{ btnTitle }}
      </el-button>
      <i18n path="common.emqx" tag="p">
        <template #emqx>
          <a :href="emqxWebsite" target="_blank" rel="noopener noreferrer">EMQX</a>
        </template>
      </i18n>
      <i18n path="common.cloud" tag="p">
        <template #cloud>
          <a :href="emqxCloudWebsite" target="_blank" rel="noopener noreferrer">EMQX Cloud</a>
        </template>
      </i18n>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import gaCustomLinks from '@/utils/gaCustomLinks'
import { LeftValues } from '@/utils/styles'

@Component
export default class EmptyPage extends Vue {
  @Prop({ required: true }) public btnTitle!: 'connections'
  @Prop({ required: true }) public name!: string
  @Prop() public clickMethod!: <T>() => T | void

  @Getter('currentLang') private getterLang!: Language
  @Getter('showConnectionList') private showConnectionList!: boolean

  get imageSrc(): string {
    return require(`../assets/images/${this.name}`)
  }

  get emqxCloudWebsite(): string {
    return gaCustomLinks(this.getterLang).empty.EMQXCloud
  }

  get emqxWebsite(): string {
    return gaCustomLinks(this.getterLang).empty.EMQX
  }

  get leftValue(): string {
    return this.showConnectionList ? LeftValues.Show : LeftValues.Hide
  }
}
</script>

<style lang="scss" scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .empty-page__block {
    text-align: center;
    animation: fade-in-up 0.6s ease forwards;
    position: relative;
    z-index: 1;

    img {
      margin-bottom: 32px;
      animation: float 4s ease-in-out infinite;
      filter: drop-shadow(0 20px 40px rgba(16, 185, 129, 0.15));
    }

    .primary-btn {
      background: var(--color-bg-btn-gradient);
      color: var(--color-text-active);
      border: none;
      padding: 12px 28px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      letter-spacing: 0.02em;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
      }

      &:active {
        transform: translateY(0);
      }

      i {
        margin-right: 6px;
      }
    }

    p {
      margin: 20px auto;
      max-width: 500px;
      color: var(--color-text-light);
      font-size: 14px;
      line-height: 1.6;

      a {
        color: var(--color-main-green);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s ease;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 1px;
          background: var(--color-main-green);
          transform: scaleX(0);
          transition: transform 0.2s ease;
        }

        &:hover::after {
          transform: scaleX(1);
        }
      }
    }
  }
}
</style>

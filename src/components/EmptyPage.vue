<template>
  <div
    class="empty-page right-content"
    :style="{
      marginLeft: leftValue,
    }"
  >
    <el-tooltip
      placement="bottom"
      :effect="theme !== 'light' ? 'light' : 'dark'"
      :open-delay="500"
      :content="$t('connections.showConnections')"
    >
      <a
        v-if="!showConnectionList"
        href="javascript:;"
        class="show-connections-button"
        @click="toggleShowConnectionList({ showConnectionList: true })"
      >
        <i class="iconfont icon-show-connections"></i>
      </a>
    </el-tooltip>
    <div class="empty-page__block">
      <div class="empty-page__hero">
        <!-- Packets orbiting the logo give a hint of data in motion -->
        <svg class="empty-page__orbits" viewBox="0 0 140 140" aria-hidden="true" focusable="false">
          <circle class="empty-page__ring" cx="70" cy="70" r="44" />
          <circle class="empty-page__ring empty-page__ring--dashed" cx="70" cy="70" r="62" />
          <g class="empty-page__orbit"><circle class="empty-page__packet" cx="70" cy="26" r="3" /></g>
          <g class="empty-page__orbit empty-page__orbit--trail">
            <circle class="empty-page__packet" cx="70" cy="26" r="2.2" />
          </g>
          <g class="empty-page__orbit empty-page__orbit--outer">
            <circle class="empty-page__packet" cx="70" cy="8" r="2.5" />
          </g>
        </svg>
        <img class="empty-page__logo" src="@/assets/images/app-logo.png" alt="" />
      </div>
      <h2 class="empty-page__title">{{ $t('connections.emptyTitle') }}</h2>
      <p class="empty-page__desc">{{ $t('connections.emptyDesc') }}</p>
      <div class="empty-page__cards">
        <button type="button" class="empty-page__card" data-test="new-connection" @click="clickMethod(false)">
          <span class="empty-page__card-icon"><i class="el-icon-plus"></i></span>
          <span class="empty-page__card-title">{{ btnTitle }}</span>
          <span class="empty-page__card-desc">{{ $t('connections.emptyNewDesc') }}</span>
        </button>
        <button type="button" class="empty-page__card" data-test="public-broker" @click="$emit('quick-connect')">
          <span class="empty-page__card-icon"><i class="el-icon-lightning"></i></span>
          <span class="empty-page__card-title">{{ $t('connections.emptyPublicTitle') }}</span>
          <span class="empty-page__card-desc">broker.emqx.io</span>
        </button>
        <button type="button" class="empty-page__card" data-test="import-data" @click="showImportData = true">
          <span class="empty-page__card-icon"><i class="el-icon-upload2"></i></span>
          <span class="empty-page__card-title">{{ $t('connections.importData') }}</span>
          <span class="empty-page__card-desc">{{ $t('connections.emptyImportDesc') }}</span>
        </button>
      </div>
    </div>
    <i18n path="connections.emptyBroker" tag="p" class="empty-page__broker-note">
      <template #emqx>
        <a :href="emqxWebsite" target="_blank" rel="noopener noreferrer">{{ $t('connections.emqxEnterprise') }}</a>
      </template>
      <template #cloud>
        <a :href="emqxCloudWebsite" target="_blank" rel="noopener noreferrer">EMQX Cloud</a>
      </template>
    </i18n>
    <ImportData :visible.sync="showImportData" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Action, Getter } from 'vuex-class'
import gaCustomLinks from '@/utils/gaCustomLinks'
import { LeftValues } from '@/utils/styles'
import ImportData from './ImportData.vue'

@Component({
  components: {
    ImportData,
  },
})
export default class EmptyPage extends Vue {
  @Prop({ required: true }) public btnTitle!: 'connections'
  @Prop() public clickMethod!: <T>() => T | void

  @Getter('currentLang') private getterLang!: Language
  @Getter('showConnectionList') private showConnectionList!: boolean
  @Getter('currentTheme') private theme!: Theme
  @Action('TOGGLE_SHOW_CONNECTION_LIST') private toggleShowConnectionList!: (payload: {
    showConnectionList: boolean
  }) => void

  private showImportData = false

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
@keyframes empty-page-orbit {
  to {
    transform: rotate(360deg);
  }
}

@keyframes empty-page-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
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
  // Follow the connection list's slide transition
  transition: margin-left 0.3s ease;

  .show-connections-button {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 2;
    color: var(--color-text-title);
    .icon-show-connections {
      font-size: 20px;
    }
  }

  .empty-page__block {
    padding-bottom: 6vh;
    text-align: center;
    animation: empty-page-enter 0.4s ease both;
  }

  .empty-page__hero {
    position: relative;
    width: 140px;
    height: 140px;
    margin: 0 auto 8px;
  }

  .empty-page__orbits {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  // --color-border-default is too close to the background in all three themes,
  // so the rings are tinted from the main green instead
  .empty-page__ring {
    fill: none;
    stroke: color-mix(in srgb, var(--color-main-green) 28%, transparent);
    stroke-width: 1;
  }

  .empty-page__ring--dashed {
    stroke: color-mix(in srgb, var(--color-main-green) 45%, transparent);
    stroke-width: 1.5;
    // dotted look: tiny dashes with rounded caps
    stroke-dasharray: 1 6;
    stroke-linecap: round;
  }

  .empty-page__orbit {
    transform-origin: 70px 70px;
    animation: empty-page-orbit 6s linear infinite;
  }

  .empty-page__orbit--trail {
    animation-delay: -3s;
    opacity: 0.5;
  }

  .empty-page__orbit--outer {
    animation-duration: 10s;
    animation-direction: reverse;
    opacity: 0.7;
  }

  .empty-page__packet {
    fill: var(--color-main-green);
  }

  .empty-page__logo {
    position: absolute;
    inset: 0;
    width: 56px;
    height: 56px;
    margin: auto;
  }

  .empty-page__title {
    margin: 0;
    color: var(--color-text-title);
    font-size: 24px;
    font-weight: 600;
  }

  .empty-page__desc {
    margin: 8px 0 36px;
    color: var(--color-text-default);
    font-size: 14px;
  }

  .empty-page__cards {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .empty-page__card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 196px;
    box-sizing: border-box;
    padding: 20px;
    border: 1px solid var(--color-border-default);
    border-radius: 14px;
    background: var(--color-bg-normal);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.2s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--color-main-green);
    }
  }

  .empty-page__card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    // --color-light-green stays pale in dark themes, so tint from the main green instead
    background: color-mix(in srgb, var(--color-main-green) 14%, transparent);
    color: var(--color-main-green);
    font-size: 19px;
  }

  .empty-page__card-title {
    display: block;
    margin: 16px 0 4px;
    color: var(--color-text-title);
    font-size: 14px;
    font-weight: 500;
  }

  .empty-page__card-desc {
    display: block;
    color: var(--color-text-light);
    font-size: 12px;
    line-height: 1.5;
  }

  .empty-page__broker-note {
    position: absolute;
    bottom: 28px;
    left: 0;
    right: 0;
    margin: 0;
    padding: 0 24px;
    text-align: center;
    color: var(--color-text-light);
    font-size: 12px;

    a {
      color: var(--color-main-green);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .empty-page {
    .empty-page__block,
    .empty-page__orbit {
      animation: none;
    }
  }
}
</style>

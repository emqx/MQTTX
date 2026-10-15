<template>
  <div class="about-view rightbar">
    <div class="about-topbar">
      <h1 class="titlebar">{{ $t('about.about') }}</h1>
      <button class="sign-in-btn" @click="goToLink(signInLink)">
        <i class="el-icon-user"></i>
        <span>{{ $t('about.signIn') }}</span>
      </button>
    </div>
    <div class="about-container" :class="{ 'is-light': getterTheme === 'light' }">
      <!-- Background Grid Effect -->
      <div class="grid-background">
        <div class="grid-lines"></div>
        <div class="gradient-orb gradient-orb--1"></div>
        <div class="gradient-orb gradient-orb--2"></div>
      </div>

      <!-- Main Content - Two Column Layout -->
      <div class="about-main">
        <!-- Left: Logo Section -->
        <div class="about-left">
          <div class="logo-section">
            <div class="logo-glow"></div>
            <img :src="mqttxLogoSrc" alt="mqttx-app-logo" class="app-logo" />
          </div>
        </div>

        <!-- Right: Content Section -->
        <div class="about-right">
          <!-- Header: Version & Quick Actions -->
          <div class="about-header">
            <div class="version-badge">
              <span class="version-label">{{ $t('common.version') }}</span>
              <span class="version-number">v{{ version }}</span>
            </div>
            <div class="quick-actions">
              <a class="action-link" :href="releasesLink" target="_blank" rel="noopener noreferrer">
                <i class="el-icon-document"></i>
                <span>{{ $t('about.releases') }}</span>
              </a>
              <span class="action-divider"></span>
              <a
                class="action-link"
                href="https://github.com/emqx/MQTTX/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="el-icon-service"></i>
                <span>{{ $t('about.support') }}</span>
              </a>
              <span class="action-divider"></span>
              <a class="action-link" href="javascript:;" @click="openDataCollectionPolicyDialog()">
                <i class="el-icon-info"></i>
                <span>{{ $t('about.dataCollectionPolicy') }}</span>
              </a>
            </div>
          </div>

          <!-- Description -->
          <div class="description-card">
            <p>{{ $t('about.mqttxDesc') }}</p>
          </div>

          <!-- Link Buttons -->
          <div class="link-buttons">
            <button class="link-btn" @click="goToLink('https://github.com/emqx/MQTTX')">
              <i class="iconfont icon-github"></i>
              <span>GitHub</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button class="link-btn" @click="goToLink(mqttxWebsite)">
              <i class="iconfont icon-website"></i>
              <span>{{ $t('about.web') }}</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button class="link-btn" @click="goToLink(faqLink)">
              <i class="iconfont icon-faq"></i>
              <span>FAQ</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <!-- Products Promotion -->
          <div class="promo">
            <div class="promo-hero">
              <div class="promo-hero__content">
                <div class="promo-hero__meta">
                  <span class="promo-hero__badge">{{ $t('about.deviceAgentBadge') }}</span>
                  <span class="promo-hero__brand">Device Agent</span>
                </div>
                <h3 class="promo-hero__title">{{ $t('about.deviceAgentTitle') }}</h3>
                <p class="promo-hero__desc">{{ $t('about.deviceAgentDesc') }}</p>
                <div class="promo-hero__actions">
                  <button
                    type="button"
                    class="promo-hero__btn promo-hero__btn--primary"
                    @click="goToLink(deviceAgentWebsite)"
                  >
                    <span>{{ $t('about.tryDeviceAgent') }}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path
                        d="M5 12H19M19 12L12 5M19 12L12 19"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="promo-hero__btn promo-hero__btn--ghost"
                    @click="goToLink(deviceAgentDocsLink)"
                  >
                    <span>{{ $t('about.deviceAgentDocs') }}</span>
                  </button>
                </div>
              </div>
              <div class="promo-hero__visual" aria-hidden="true">
                <svg viewBox="0 0 120 88" fill="none">
                  <defs>
                    <linearGradient
                      id="promoCoreGradient"
                      x1="78"
                      y1="30"
                      x2="106"
                      y2="58"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stop-color="#a78bfa" />
                      <stop offset="1" stop-color="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <rect class="promo-node" x="2" y="12" width="22" height="12" rx="3" />
                  <rect class="promo-node" x="2" y="38" width="22" height="12" rx="3" />
                  <rect class="promo-node" x="2" y="64" width="22" height="12" rx="3" />
                  <path class="promo-flow promo-flow--1" d="M24 18H56C66 18 70 34 78 40" />
                  <path class="promo-flow promo-flow--2" d="M24 44H78" />
                  <path class="promo-flow promo-flow--3" d="M24 70H56C66 70 70 54 78 48" />
                  <circle class="promo-core-ring" cx="92" cy="44" r="22" />
                  <circle cx="92" cy="44" r="14" fill="url(#promoCoreGradient)" />
                  <path
                    class="promo-core-mark"
                    d="M86 48.5L90 39.5L94 48.5M87.5 45.5H92.5"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path class="promo-core-mark" d="M97 39.5V48.5" stroke-width="1.6" stroke-linecap="round" />
                </svg>
              </div>
            </div>

            <div class="promo-row">
              <div class="promo-card">
                <h4 class="promo-card__title">EMQX Platform</h4>
                <p class="promo-card__desc">{{ $t('about.platformDescShort') }}</p>
                <button type="button" class="promo-card__link" @click="goToLink(emqxPlatformWebsite)">
                  <span>{{ $t('about.tryPlatform') }}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div class="promo-card">
                <h4 class="promo-card__title">EMQX Cloud</h4>
                <p class="promo-card__desc">{{ $t('about.cloudDescShort') }}</p>
                <button type="button" class="promo-card__link" @click="goToLink(emqxCloudWebsite)">
                  <span>{{ $t('about.tryCloud') }}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="about-footer">
            <div class="footer-brand">
              <img :src="emqLogoSrc" alt="emqx" class="emq-logo" />
              <span class="copyright">
                &copy;{{ fullYear }}
                <a :href="emqWebsite" target="_blank" rel="noopener noreferrer">EMQ</a>
                Technologies Inc.
              </span>
            </div>
            <div class="footer-social">
              <a
                target="_blank"
                rel="noopener noreferrer"
                class="social-link"
                href="https://twitter.com/EMQTech"
                title="X (Twitter)"
              >
                <i class="iconfont icon-x"></i>
              </a>
              <a
                target="_blank"
                rel="noopener noreferrer"
                class="social-link"
                href="https://discord.gg/xYGf3fQnES"
                title="Discord"
              >
                <i class="iconfont icon-discord"></i>
              </a>
              <a
                target="_blank"
                rel="noopener noreferrer"
                class="social-link"
                href="https://slack-invite.emqx.io/"
                title="Slack"
              >
                <i class="iconfont icon-slack"></i>
              </a>
              <el-popover v-if="getterLang === 'zh'" placement="top-start" width="30" trigger="click">
                <img class="emqx-wechat" src="@/assets/images/wx_qr_code.png" alt="wechat" />
                <span class="social-link" slot="reference" title="WeChat">
                  <i class="iconfont icon-we-chat"></i>
                </span>
              </el-popover>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DataCollectionPolicy :visible.sync="showDataCollectionPolicyDialog" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import DataCollectionPolicy from '@/components/DataCollectionPolicy.vue'
import gaCustomLinks from '@/utils/gaCustomLinks'

@Component({
  components: {
    DataCollectionPolicy,
  },
})
export default class About extends Vue {
  @Getter('currentTheme') private getterTheme!: Theme
  @Getter('currentLang') private getterLang!: Language

  private version = `${process.env.VUE_APP_VERSION}`
  private showDataCollectionPolicyDialog = false

  get fullYear(): number {
    return new Date().getFullYear()
  }

  get mqttxLogoSrc(): string {
    if (this.getterTheme === 'light') {
      return require('@/assets/images/mqttx-dark.png')
    }
    return require('@/assets/images/mqttx-light.png')
  }

  get emqLogoSrc(): string {
    if (this.getterTheme === 'light') {
      return require('@/assets/images/emq-logo-dark.png')
    }
    return require('@/assets/images/emq-logo-light.png')
  }

  get emqWebsite(): string {
    return gaCustomLinks(this.getterLang).about.EMQ
  }

  get emqxPlatformWebsite(): string {
    return gaCustomLinks(this.getterLang).about.EMQXPlatform
  }

  get emqxCloudWebsite(): string {
    return gaCustomLinks(this.getterLang).about.EMQXCloud
  }

  get deviceAgentWebsite(): string {
    return gaCustomLinks(this.getterLang).about.deviceAgent
  }

  get deviceAgentDocsLink(): string {
    return gaCustomLinks(this.getterLang).about.deviceAgentDocs
  }

  get signInLink(): string {
    return gaCustomLinks(this.getterLang).about.signIn
  }

  get mqttxWebsite(): string {
    return gaCustomLinks(this.getterLang).MQTTXSite
  }

  get releasesLink(): string {
    return `${this.mqttxWebsite}/changelogs/v${this.version}`
  }

  get faqLink(): string {
    return gaCustomLinks(this.getterLang).about.faq
  }

  private goToLink(url: string) {
    const windowUrl = window.open(url)
    if (windowUrl) {
      windowUrl.opener = null
    }
  }

  private openDataCollectionPolicyDialog() {
    this.showDataCollectionPolicyDialog = true
  }
}
</script>

<style lang="scss" scoped>
.about-view {
  position: relative;
  padding: 0 16px;
  overflow: hidden;
}

.about-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .titlebar {
    margin: 0;
  }
}

.sign-in-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;

  i {
    font-size: 13px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
  }

  &:active {
    transform: translateY(0);
  }
}

.about-container {
  position: relative;
  height: calc(100% - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}

/* Background Effects */
.grid-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(var(--color-border-default) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-border-default) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.3;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.35;
  animation: float 8s ease-in-out infinite;
}

.gradient-orb--1 {
  width: 350px;
  height: 350px;
  background: var(--color-main-green);
  top: 10%;
  left: 20%;
  animation-delay: 0s;
}

.gradient-orb--2 {
  width: 280px;
  height: 280px;
  background: var(--color-minor-green);
  bottom: 20%;
  right: 15%;
  animation-delay: -4s;
}

.about-container.is-light {
  .gradient-orb {
    display: none;
  }

  .logo-glow {
    display: none;
  }

  .grid-lines {
    opacity: 0.5;
    background-image: linear-gradient(#d0d5dd 1px, transparent 1px),
      linear-gradient(90deg, #d0d5dd 1px, transparent 1px);
  }

  .action-link {
    color: var(--color-text-default);

    i {
      color: var(--color-text-default);
    }
  }

  .version-badge {
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .description-card {
    background: #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .link-btn {
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    &:hover {
      background: linear-gradient(135deg, #f0fdf6 0%, #f5f7ff 100%);
      box-shadow: 0 8px 24px rgba(52, 195, 136, 0.15);
    }
  }

  .social-link {
    &:hover {
      background: #f5f7fa;
    }
  }

  .promo-hero {
    background: #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .promo-hero__brand {
    color: #4b5563;
  }

  .promo-hero__title {
    color: #1e1b4b;
  }

  .promo-hero__desc {
    color: #6b7280;
  }

  .promo-hero__btn--ghost {
    background: rgba(124, 58, 237, 0.08);
    color: #5b21b6;

    &:hover {
      background: rgba(124, 58, 237, 0.16);
      color: #5b21b6;
    }
  }

  .promo-hero__visual {
    .promo-node {
      fill: rgba(17, 24, 39, 0.04);
      stroke: rgba(17, 24, 39, 0.2);
    }

    .promo-flow {
      stroke: rgba(124, 58, 237, 0.35);
    }

    .promo-core-ring {
      stroke: rgba(124, 58, 237, 0.3);
    }
  }

  .promo-card {
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -20px) scale(1.05);
  }
  50% {
    transform: translate(0, 20px) scale(1);
  }
  75% {
    transform: translate(-20px, -10px) scale(0.95);
  }
}

/* Main Content - Two Column */
.about-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 80px;
  max-width: 900px;
  width: 100%;
  margin: auto;
}

/* Left Column - Logo */
.about-left {
  flex-shrink: 0;
}

.logo-section {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-glow {
  position: absolute;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, var(--color-main-green) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.6;
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.4;
  }
}

.app-logo {
  position: relative;
  z-index: 1;
  width: 140px;
  height: auto;
  transition: transform 0.3s ease;
}

.logo-section:hover .app-logo {
  transform: scale(1.05);
}

/* Right Column - Content */
.about-right {
  flex: 1;
  min-width: 0;
  padding: 20px 0;
}

/* Header */
.about-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.version-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: var(--color-bg-card-gradient);
  border-radius: 100px;
}

.version-label {
  font-size: 13px;
  color: var(--color-text-light);
  font-weight: 500;
}

.version-number {
  font-size: 14px;
  color: var(--color-main-green);
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  color: var(--color-text-light);
  font-size: 13px;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;

  i {
    font-size: 14px;
  }

  &:hover {
    color: var(--color-main-green);
    background: var(--color-bg-card-normal);
  }
}

.action-divider {
  width: 1px;
  height: 14px;
  background: var(--color-border-default);
}

/* Description Card */
.description-card {
  background: var(--color-bg-card-gradient);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;

  p {
    color: var(--color-text-default);
    font-size: 14px;
    line-height: 1.7;
    margin: 0;
  }
}

/* Link Buttons */
.link-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
}

.link-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--color-bg-card-gradient);
  border: none;
  border-radius: 10px;
  color: var(--color-text-default);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;

  .iconfont {
    font-size: 18px;
    color: var(--color-text-card_icon);
  }

  .arrow-icon {
    width: 14px;
    height: 14px;
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.25s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px var(--color-shadow-card);

    .arrow-icon {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &:active {
    transform: translateY(0);
  }
}

/* Products Promotion */
.promo {
  margin-bottom: 12px;
}

.promo-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #7c3aed, #3b82f6, #7c3aed);
  }
}

.promo-hero__content {
  flex: 1;
  min-width: 0;
}

.promo-hero__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.promo-hero__badge {
  padding: 2px 7px;
  border-radius: 100px;
  background: linear-gradient(135deg, #34c388 0%, #10b981 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.promo-hero__brand {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.promo-hero__title {
  margin: 0 0 6px 0;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
}

.promo-hero__desc {
  margin: 0 0 14px 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12.5px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.promo-hero__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.promo-hero__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;

  svg {
    width: 14px;
    height: 14px;
    transition: transform 0.25s ease;
  }

  &--primary {
    background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
    color: #fff;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);

      svg {
        transform: translateX(4px);
      }
    }
  }

  &--ghost {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.promo-hero__visual {
  flex-shrink: 0;
  width: 110px;

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .promo-node {
    fill: rgba(255, 255, 255, 0.08);
    stroke: rgba(255, 255, 255, 0.32);
    stroke-width: 1;
  }

  .promo-flow {
    stroke: rgba(255, 255, 255, 0.3);
    stroke-width: 1.2;
    stroke-dasharray: 3 4;
    animation: promo-flow 1.6s linear infinite;
  }

  .promo-flow--2 {
    animation-delay: 0.25s;
  }

  .promo-flow--3 {
    animation-delay: 0.5s;
  }

  .promo-core-ring {
    stroke: rgba(124, 58, 237, 0.45);
    stroke-width: 1;
    stroke-dasharray: 3 5;
  }

  .promo-core-mark {
    stroke: #fff;
  }
}

@keyframes promo-flow {
  to {
    stroke-dashoffset: -14;
  }
}

@media (prefers-reduced-motion: reduce) {
  .promo-hero__visual .promo-flow {
    animation: none;
  }
}

.promo-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.promo-card {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--color-bg-card-gradient);
}

.promo-card__title {
  margin: 0 0 6px 0;
  color: var(--color-text-default);
  font-size: 13px;
  font-weight: 600;
}

.promo-card__desc {
  flex: 1;
  margin: 0 0 10px 0;
  color: var(--color-text-light);
  font-size: 12px;
  line-height: 1.55;
}

.promo-card__link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-main-green);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  svg {
    width: 13px;
    height: 13px;
    transition: transform 0.25s ease;
  }

  &:hover svg {
    transform: translateX(3px);
  }
}
/* Footer */
.about-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.emq-logo {
  width: 32px;
  height: auto;
  opacity: 0.8;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}

.copyright {
  font-size: 12px;
  color: var(--color-text-light);

  a {
    color: var(--color-text-default);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--color-main-green);
    }
  }
}

.footer-social {
  display: flex;
  align-items: center;
  gap: 4px;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: var(--color-text-light);
  background: transparent;
  transition: all 0.2s ease;
  cursor: pointer;

  .iconfont {
    font-size: 16px;
  }

  &:hover {
    color: var(--color-main-green);
    background: var(--color-bg-card-normal);
  }
}

.emqx-wechat {
  width: 150px;
  height: auto;
}
</style>

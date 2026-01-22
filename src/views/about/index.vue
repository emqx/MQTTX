<template>
  <div class="about-view rightbar">
    <div class="about-topbar">
      <h1 class="titlebar">{{ $t('about.about') }}</h1>
      <button type="button" class="sign-in-btn" @click="goToLink(signInLink)">
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
              <a class="action-link" href="javascript:;" @click.prevent.stop="checkUpdate">
                <i class="el-icon-refresh" :class="{ 'is-rotating': isCheckingUpdate }"></i>
                <span>{{ $t('about.update') }}</span>
              </a>
              <span class="action-divider"></span>
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
            </div>
          </div>

          <!-- Description -->
          <div class="description-card">
            <p>{{ $t('about.mqttxDesc') }}</p>
          </div>

          <!-- Link Buttons -->
          <div class="link-buttons">
            <button type="button" class="link-btn" @click="goToLink('https://github.com/emqx/MQTTX')">
              <i class="iconfont icon-github"></i>
              <span>GitHub</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button type="button" class="link-btn" @click="goToLink(mqttxWebsite)">
              <i class="iconfont icon-website"></i>
              <span>{{ $t('about.web') }}</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button type="button" class="link-btn" @click="goToLink(faqLink)">
              <i class="iconfont icon-faq"></i>
              <span>FAQ</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <!-- EMQX Platform Promotion -->
          <div class="platform-promo">
            <h3 class="platform-promo__title">EMQX Platform - {{ $t('about.platformTitle') }}</h3>
            <p class="platform-promo__desc">{{ $t('about.platformDesc') }}</p>
            <div class="platform-promo__stats">
              <div class="stat-item">
                <span class="stat-value">50M+</span>
                <span class="stat-label">{{ $t('about.statDownloads') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">400K+</span>
                <span class="stat-label">{{ $t('about.statClusters') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">100+</span>
                <span class="stat-label">{{ $t('about.statProtocols') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">&lt;5ms</span>
                <span class="stat-label">{{ $t('about.statLatency') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">10M+</span>
                <span class="stat-label">{{ $t('about.statConnections') }}</span>
              </div>
            </div>
            <div class="platform-promo__actions">
              <button
                type="button"
                class="platform-promo__btn platform-promo__btn--primary"
                @click="goToLink(emqxPlatformWebsite)"
              >
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
                  <i class="iconfont icon-wechat"></i>
                </span>
              </el-popover>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { ipcRenderer } from 'electron'
import version from '@/version'
import gaCustomLinks from '@/utils/gaCustomLinks'

@Component
export default class About extends Vue {
  @Getter('currentTheme') private getterTheme!: Theme
  @Getter('currentLang') private getterLang!: Language

  private isCheckingUpdate = false

  get version(): string {
    return version
  }

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

  get emqxCloudWebsite(): string {
    return gaCustomLinks(this.getterLang).about.EMQXCloud
  }

  get emqxPlatformWebsite(): string {
    return gaCustomLinks(this.getterLang).about.EMQXPlatform
  }

  get signInLink(): string {
    return gaCustomLinks(this.getterLang).about.signIn
  }

  get mqttxWebsite(): string {
    return gaCustomLinks(this.getterLang).about.MQTTX
  }

  get releasesLink(): string {
    return gaCustomLinks(this.getterLang).about.releases
  }

  get faqLink(): string {
    return gaCustomLinks(this.getterLang).about.faq
  }

  private checkUpdate(): void {
    this.isCheckingUpdate = true
    ipcRenderer.send('clickUpdate')
    setTimeout(() => {
      this.isCheckingUpdate = false
    }, 2000)
  }

  private goToLink(url: string) {
    const windowUrl = window.open(url)
    if (windowUrl) {
      windowUrl.opener = null
    }
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

  .platform-promo {
    background: #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    &::before {
      background: linear-gradient(90deg, #7c3aed, #3b82f6, #7c3aed);
    }

    &::after {
      background: radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%);
    }
  }

  .platform-promo__title {
    color: #1e1b4b;
  }

  .platform-promo__desc {
    color: #4b5563;
  }

  .stat-value {
    background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-label {
    color: #6b7280;
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
    transition: transform 0.3s ease;

    &.is-rotating {
      animation: spin 1s linear infinite;
      color: var(--color-main-green);
    }
  }

  &:hover {
    color: var(--color-main-green);
    background: var(--color-bg-card-normal);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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

/* Platform Promotion */
.platform-promo {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%);
  border-radius: 14px;
  padding: 24px;
  margin-top: 8px;
  margin-bottom: 24px;
  position: relative;
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

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }
}

.platform-promo__title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 16px 0;
}

.platform-promo__desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.platform-promo__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
}

.stat-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.3;
}

.platform-promo__actions {
  display: flex;
  gap: 12px;
}

.platform-promo__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;

  svg {
    width: 16px;
    height: 16px;
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

  &:active {
    transform: translateY(0);
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

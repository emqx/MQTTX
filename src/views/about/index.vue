<template>
  <div class="about-view rightbar">
    <h1 class="titlebar">{{ $t('about.about') }}</h1>
    <div class="about-block">
      <div class="about-logo">
        <img :src="mqttxLogoSrc" alt="mqttx-app-logo" width="200" height="192" />
      </div>
      <div class="about-content">
        <div class="about-content__header">
          <p class="version">{{ $t('common.version') }} v{{ version }}</p>
          <p class="help">
            <a class="web-link" href="javascript:;" @click="checkUpdate">{{ $t('about.update') }}</a>
            <a class="web-link" href="https://github.com/emqx/MQTTX/releases" target="_blank" rel="noopener noreferrer">
              {{ $t('about.releases') }}
            </a>
            <a class="web-link" href="https://github.com/emqx/MQTTX/issues" target="_blank" rel="noopener noreferrer">
              {{ $t('about.support') }}
            </a>
          </p>
          <div class="description">
            <p>{{ $t('about.mqttxDesc') }}</p>
          </div>
          <div class="description">
            <p v-html="$t('common.cloud')"></p>
          </div>
          <div class="description">
            <i18n path="about.emqxLocal.local" tag="span">
              <a :href="emqxWebsite" target="_blank" rel="noopener noreferrer">{{ $t('about.emqxLocal.emqx') }}</a>
            </i18n>
            {{ $t('about.emqxDesc') }}
          </div>
          <div class="description">
            <i18n path="about.emqxDocker.local" tag="span">
              <a :href="emqxIoWebsite" target="_blank" rel="noopener noreferrer">
                {{ $t('about.emqxDocker.emqx') }}
              </a>
            </i18n>
            <div class="docker-code">
              docker run -d --name emqx -p 1883:1883 -p 8083:8083 -p 8883:8883 -p 8084:8084 -p 18083:18083 emqx/emqx
            </div>
          </div>
          <div class="btns">
            <el-button class="link-btn emqx-cloud" type="primary" @click="goToLink(emqxCloudWebsite)">
              <i class="iconfont icon-cloud-logo"></i> EMQ X Cloud <i class="iconfont icon-right"></i>
            </el-button>
            <el-button class="link-btn github" type="primary" plain @click="goToLink('https://github.com/emqx/MQTTX')">
              <i class="iconfont icon-github"></i> {{ $t('about.followGithub') }}
            </el-button>
          </div>
        </div>
        <div class="about-content__footer">
          <div class="emq-logo">
            <img :src="emqLogoSrc" alt="emqx" width="40" />
            <span class="copyright">
              &copy;2021 <a :href="emqWebsite" target="_blank" rel="noopener noreferrer">EMQ</a> Technologies Co., Ltd.
            </span>
          </div>
          <div class="follow-items">
            <a target="_blank" rel="noopener noreferrer" class="follow-link" href="https://twitter.com/EMQTech">
              <i class="iconfont icon-ttww"></i>
            </a>
            <a target="_blank" rel="noopener noreferrer" class="follow-link" href="https://slack-invite.emqx.io/">
              <i class="iconfont icon-slack"></i>
            </a>
            <a target="_blank" rel="noopener noreferrer" class="follow-link" href="https://www.reddit.com/r/emqx/">
              <i class="iconfont icon-reddit-circle"></i>
            </a>
            <template v-if="getterLang === 'zh'">
              <a target="_blank" rel="noopener noreferrer" class="follow-link" href="https://weibo.com/emqtt">
                <i class="iconfont icon-weibo"></i>
              </a>
              <el-popover placement="top-start" width="30" trigger="click">
                <img class="emqx-wechat" src="@/assets/images/wx_qr_code.png" alt="qq" />
                <span class="follow-link" slot="reference">
                  <i class="iconfont icon-we-chat"></i>
                </span>
              </el-popover>
            </template>
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

@Component
export default class About extends Vue {
  @Getter('currentTheme') private getterTheme!: Theme
  @Getter('currentLang') private getterLang!: Language

  private baseUrl = 'https://www.emqx.com'
  private utm = '?utm_source=mqttx&utm_medium=app&utm_campaign='

  get version(): string {
    return version
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
    const lang = this.getterLang === 'zh' ? 'zh' : 'en'
    return `${this.baseUrl}/${lang}${this.utm}emq`
  }

  get emqxWebsite(): string {
    const lang = this.getterLang === 'zh' ? 'zh' : 'en'
    return `${this.baseUrl}/${lang}/products/emqx${this.utm}enterpirse`
  }

  get emqxCloudWebsite(): string {
    const lang = this.getterLang === 'zh' ? 'zh' : 'en'
    return `${this.baseUrl}/${lang}/cloud${this.utm}cloud`
  }

  get emqxIoWebsite(): string {
    const baseUrl = 'https://www.emqx.io/'
    const lang = this.getterLang === 'zh' ? 'zh' : 'en'
    if (lang === 'zh') {
      return `${baseUrl}zh${this.utm}broker`
    }
    return `${baseUrl}${this.utm}broker`
  }

  private checkUpdate(): void {
    ipcRenderer.send('checkUpdate')
  }

  private goToLink(url: string) {
    const windowUrl = window.open(url)
    if (windowUrl) {
      windowUrl.opener = null
    }
  }
}
</script>

<style lang="scss" scope>
.about-view {
  position: relative;
  padding: 0 16px;

  & > .about-block {
    height: 86%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    .about-logo {
      margin-left: 60px;
      img {
        max-width: none;
      }
    }
    .about-content {
      margin-left: 120px;
      margin-right: 60px;
      .version {
        font-size: 24px;
        margin-bottom: 16px;
        color: var(--color-text-title);
        font-weight: 600;
      }
      .help {
        .web-link {
          padding-right: 12px;
          padding-left: 12px;
          border-right: 1px solid var(--color-border-default);
          &:first-child {
            padding-left: 0px;
          }
          &:last-child {
            border-right: none;
            padding-right: 0px;
          }
        }
        margin-bottom: 48px;
      }
      .description {
        max-width: 560px;
        line-height: 1.6;
        margin-bottom: 24px;
        .docker-code {
          background: var(--color-bg-code);
          padding: 10px;
          border-radius: 8px;
          user-select: all;
          margin-top: 8px;
        }
      }
      .btns {
        margin-top: 24px;
        margin-bottom: 35px;
        display: flex;
        .el-button + .el-button {
          margin-left: 16px;
        }
        .link-btn {
          font-size: 1rem;
          border: none;
          &.emqx-cloud {
            padding: 12px;
            background: linear-gradient(90deg, #35c98d 0%, #37dc85 100%);
          }
          &.github {
            padding: 10px;
            border: 2px solid var(--color-main-green);
            background: transparent;
            &:hover {
              color: var(--color-main-green);
            }
          }
          .iconfont {
            font-size: 20px;
          }
          span {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }
      }
      .about-content__header {
        border-bottom: 1px solid var(--color-border-default);
      }
      .about-content__footer {
        margin-top: 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        .emq-logo {
          img {
            margin-right: 6px;
          }
        }
        .follow-items {
          float: right;
          .follow-link {
            cursor: pointer;
            width: 24px;
            height: 24px;
            color: var(--color-text-light);
            margin-right: 16px;
            &:last-child {
              margin-right: 0px;
            }
            .iconfont {
              font-size: 20px;
            }
          }
        }
      }
    }
  }
}
</style>

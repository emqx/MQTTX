<template>
  <div class="help-view rightbar">
    <!-- Background grid pattern -->
    <div class="help-bg-pattern"></div>

    <div class="help-content">
      <div class="help-view-header">
        <h1 class="titlebar">{{ $t('help.helpMQTT') }}</h1>
        <el-tooltip
          v-if="getterLang === 'zh'"
          placement="bottom"
          :effect="theme !== 'light' ? 'light' : 'dark'"
          content="2023 MQTT 协议入门教程"
        >
          <a
            target="_blank"
            rel="noopener noreferrer"
            class="ebook-link"
            href="https://www.emqx.com/zh/resources/beginners-guide-to-the-mqtt-protocol?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-mqtt-ebook-zh"
          >
            下载 MQTT 电子书
            <span>→</span>
          </a>
        </el-tooltip>
      </div>

      <!-- Quick Access Cards -->
      <section class="quick-access">
        <div
          v-for="(item, index) in helpTop"
          :key="item.icon"
          class="access-card"
          :style="{ animationDelay: `${index * 0.1}s` }"
          @click="goToLink(item.link)"
        >
          <div class="card-glow"></div>
          <div class="card-content">
            <div class="card-icon-wrap">
              <img :src="require(`@/assets/images/help/${item.icon}.png`)" :alt="item.icon" />
            </div>
            <div class="card-info">
              <h3>{{ item.title }}</h3>
              <span class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Beginner's Guide Section -->
      <section class="guide-section">
        <div class="section-header">
          <div class="section-line"></div>
          <div class="section-badge">GUIDE</div>
          <h2>{{ $t('help.guideTitle') }}</h2>
          <p>{{ $t('help.guideDesc') }}</p>
        </div>

        <div class="guide-grid">
          <template v-for="(item, index) in helpGuide">
            <article
              v-if="item.link"
              :key="item.link"
              class="guide-card"
              :style="{ animationDelay: `${index * 0.05}s` }"
              @click="goToLink(`${item.link}${blogUtm}`)"
            >
              <span class="guide-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="guide-content">
                <h4>{{ item.title }}</h4>
                <div class="guide-arrow">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 17L17 7M17 7H7M17 7v10"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div class="guide-hover-line"></div>
            </article>
          </template>
        </div>
      </section>

      <!-- Programming Section -->
      <section class="practice-section">
        <div class="section-header">
          <div class="section-line"></div>
          <div class="section-badge">CODE</div>
          <h2>{{ $t('help.practiceTitle') }}</h2>
          <p>{{ $t('help.practiceDesc') }}</p>
        </div>

        <div class="practice-grid">
          <template v-for="(item, index) in helpPractice">
            <div
              v-if="item.link"
              :key="item.icon"
              class="practice-card"
              :style="{ animationDelay: `${index * 0.03}s` }"
              @click="goToLink(`${item.link}${blogUtm}`)"
            >
              <div class="practice-icon">
                <img
                  :class="[{ invert: item.invert && item.invert.includes(theme) }]"
                  :src="require(`@/assets/images/help/${item.icon}.png`)"
                  :alt="item.icon"
                />
              </div>
              <span class="practice-name">{{ item.title }}</span>
              <div class="practice-pulse"></div>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import gaCustomLinks from '@/utils/gaCustomLinks'

@Component
export default class Help extends Vue {
  @Getter('currentTheme') private theme!: Theme
  @Getter('currentLang') private getterLang!: Language

  get emqWebsite(): string {
    return gaCustomLinks(this.getterLang).EMQSite
  }

  get mqttxWebsite(): string {
    return gaCustomLinks(this.getterLang).MQTTXSite
  }

  get blogUtm(): string {
    return gaCustomLinks(this.getterLang).help.blogUtm
  }

  get helpTop() {
    const { learnMQTT, publicMqttBroker, mqtt5 } = gaCustomLinks(this.getterLang).help
    return [
      {
        icon: 'icon-learn-mqtt',
        title: this.$tc('help.learn'),
        link: learnMQTT,
      },
      {
        icon: 'icon-public-mqtt-broker',
        title: this.$tc('help.publicMqttBroker'),
        link: publicMqttBroker,
      },
      {
        icon: 'icon-mqtt5',
        title: this.$tc('help.mqtt5Explore'),
        link: mqtt5,
      },
    ]
  }

  get helpGuide() {
    return [
      {
        title: this.$tc('help.guideArticle1'),
        link: `${this.emqWebsite}/blog/what-is-the-mqtt-protocol`,
      },
      {
        title: this.$tc('help.guideArticle2'),
        link: `${this.emqWebsite}/blog/the-easiest-guide-to-getting-started-with-mqtt`,
      },
      {
        title: this.$tc('help.guideArticle3'),
        link: `${this.emqWebsite}/blog/mqtt-5-introduction-to-publish-subscribe-model`,
      },
      {
        title: this.$tc('help.guideArticle4'),
        link: `${this.emqWebsite}/blog/how-to-set-parameters-when-establishing-an-mqtt-connection`,
      },
      {
        title: this.$tc('help.guideArticle5'),
        link: `${this.emqWebsite}/blog/advanced-features-of-mqtt-topics`,
      },
      {
        title: this.$tc('help.guideArticle6'),
        link: `${this.emqWebsite}/blog/mqtt-session`,
      },
      {
        title: this.$tc('help.guideArticle7'),
        link: `${this.emqWebsite}/blog/introduction-to-mqtt-qos`,
      },
      {
        title: this.$tc('help.guideArticle8'),
        link: `${this.emqWebsite}/blog/mqtt5-features-retain-message`,
      },
      {
        title: this.$tc('help.guideArticle9'),
        link: `${this.emqWebsite}/blog/use-of-mqtt-will-message`,
      },
      {
        title: this.$tc('help.guideArticle10'),
        link: `${this.emqWebsite}/blog/mqtt-keep-alive`,
      },
    ]
  }

  get helpPractice() {
    return [
      {
        icon: 'icon-java',
        title: 'Java',
        link: `${this.emqWebsite}/blog/how-to-use-mqtt-in-java`,
      },
      {
        icon: 'icon-nodejs',
        title: 'Node.js',
        link: `${this.emqWebsite}/blog/how-to-use-mqtt-in-nodejs`,
      },
      {
        icon: 'icon-go',
        title: 'Golang',
        link: `${this.emqWebsite}/blog/how-to-use-mqtt-in-golang`,
      },
      {
        icon: 'icon-python',
        title: 'Python',
        link: `${this.emqWebsite}/blog/how-to-use-mqtt-in-python`,
      },
      {
        icon: 'icon-php',
        title: 'PHP',
        link: `${this.emqWebsite}/blog/how-to-use-mqtt-in-php`,
      },
      {
        icon: 'icon-rust',
        invert: ['dark', 'night'],
        title: 'Rust',
        link: `${this.emqWebsite}/blog/how-to-use-mqtt-in-rust`,
      },
      {
        icon: 'icon-javascript',
        title: 'JavaScript',
        link: `${this.emqWebsite}/blog/mqtt-js-tutorial`,
      },
      {
        icon: 'icon-vue',
        title: 'Vue.js',
        link: `${this.emqWebsite}/blog/how-to-use-mqtt-in-vue`,
      },
      {
        icon: 'icon-react',
        title: 'React',
        link: `${this.emqWebsite}/blog/how-to-use-mqtt-in-react`,
      },
      {
        icon: 'icon-angular',
        title: 'Angular',
        link: `${this.emqWebsite}/blog/how-to-use-mqtt-in-angular`,
      },
      {
        icon: 'icon-websocket',
        invert: ['dark', 'night'],
        title: 'WebSocket',
        link: `${this.emqWebsite}/blog/connect-to-mqtt-broker-with-websocket`,
      },
      {
        icon: 'icon-electron',
        title: 'Electron',
        link: `${this.emqWebsite}/blog/how-to-use-mqtt-in-electron`,
      },
      {
        icon: 'icon-mini-program',
        title: this.$tc('help.miniProgram'),
        link: this.$i18n.locale === 'zh' ? `${this.emqWebsite}/blog/how-to-use-mqtt-in-wechat-miniprogram` : '',
      },
      {
        icon: 'icon-flutter',
        title: 'Flutter',
        link: `${this.emqWebsite}/blog/using-mqtt-in-flutter`,
      },
      {
        icon: 'icon-ios',
        invert: ['dark', 'night'],
        title: 'iOS',
        link: `${this.emqWebsite}/blog/ios-mqtt5-client`,
      },
      {
        icon: 'icon-android',
        title: 'Android',
        link: `${this.emqWebsite}/blog/android-connects-mqtt-using-kotlin`,
      },
      {
        icon: 'icon-raspberry-pi',
        title: this.$tc('help.raspberryPi'),
        link: `${this.emqWebsite}/blog/use-mqtt-with-raspberry-pi`,
      },
      {
        icon: 'icon-esp32',
        title: 'ESP32',
        link: `${this.emqWebsite}/blog/esp32-connects-to-the-free-public-mqtt-broker`,
      },
      {
        icon: 'icon-esp8266',
        title: 'ESP8266',
        link: `${this.emqWebsite}/blog/esp8266_mqtt_led`,
      },
    ]
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
.help-view {
  position: relative;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;

  // Background grid pattern
  .help-bg-pattern {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.35;
    background-image: linear-gradient(to right, var(--color-border-default) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-border-default) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 70%);
  }

  .help-content {
    position: relative;
    z-index: 1;
    padding: 0 16px 80px;
  }
}

// Header
.help-view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .ebook-link {
    display: block;
    color: var(--color-main-green);
    font-size: 13px;
    text-decoration: none;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }

    span {
      margin-left: 4px;
    }
  }
}

// Quick Access Cards
.quick-access {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 64px;

  .access-card {
    position: relative;
    padding: 28px 24px;
    background: var(--color-bg-card-normal);
    border: 1px solid var(--color-border-default);
    border-radius: 16px;
    cursor: pointer;
    overflow: hidden;
    animation: fadeInUp 0.6s ease-out both;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      border-color: var(--color-main-green);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);

      .card-glow {
        opacity: 1;
      }

      .card-arrow svg {
        transform: translateX(4px);
      }
    }

    .card-glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      background: linear-gradient(135deg, var(--color-light-green) 0%, transparent 60%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .card-content {
      position: relative;
      z-index: 1;
    }

    .card-icon-wrap {
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      padding: 10px;
      background: var(--color-bg-primary);
      border-radius: 12px;
      border: 1px solid var(--color-border-default);

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .card-info {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        font-size: 15px;
        font-weight: 600;
        color: var(--color-text-title);
        margin: 0;
      }

      .card-arrow {
        width: 20px;
        height: 20px;
        color: var(--color-text-light);
        transition: all 0.25s ease;

        svg {
          width: 100%;
          height: 100%;
          transition: transform 0.25s ease;
        }
      }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Section Header Style
.section-header {
  position: relative;
  margin-bottom: 32px;
  padding-left: 20px;

  .section-line {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--color-main-green) 0%, transparent 100%);
    border-radius: 2px;
  }

  .section-badge {
    display: inline-block;
    padding: 4px 10px;
    margin-bottom: 12px;
    background: var(--color-light-green);
    border: 1px solid var(--color-minor-green);
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--color-main-green);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  }

  h2 {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-title);
    margin: 0 0 8px;
    letter-spacing: -0.01em;
  }

  p {
    font-size: 14px;
    color: var(--color-text-light);
    margin: 0;
    line-height: 1.6;
  }
}

// Guide Section
.guide-section {
  margin-bottom: 64px;

  .guide-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .guide-card {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 24px;
    background: var(--color-bg-normal);
    border: 1px solid var(--color-border-default);
    border-radius: 12px;
    cursor: pointer;
    overflow: hidden;
    animation: fadeInUp 0.5s ease-out both;
    transition: all 0.25s ease;

    &:hover {
      border-color: var(--color-minor-green);
      background: var(--color-bg-card-normal);

      .guide-number {
        color: var(--color-main-green);
        background: var(--color-light-green);
      }

      .guide-arrow {
        opacity: 1;
        transform: translate(0, 0);
      }

      .guide-hover-line {
        transform: scaleX(1);
      }
    }

    .guide-number {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-primary);
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      color: var(--color-text-light);
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      transition: all 0.25s ease;
    }

    .guide-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-title);
        margin: 0;
        line-height: 1.5;
      }

      .guide-arrow {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        color: var(--color-main-green);
        opacity: 0;
        transform: translate(-8px, 8px);
        transition: all 0.25s ease;

        svg {
          width: 100%;
          height: 100%;
        }
      }
    }

    .guide-hover-line {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--color-main-green);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s ease;
    }
  }
}

// Practice Section
.practice-section {
  padding-bottom: 40px;

  .practice-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 16px;
  }

  .practice-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px 20px;
    background: var(--color-bg-normal);
    border: 1px solid var(--color-border-default);
    border-radius: 12px;
    cursor: pointer;
    overflow: hidden;
    animation: fadeInUp 0.4s ease-out both;
    transition: all 0.25s ease;

    &:hover {
      transform: translateY(-4px);
      border-color: var(--color-minor-green);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);

      .practice-icon {
        transform: scale(1.1);
      }

      .practice-pulse {
        animation: pulseRing 1s ease-out;
      }
    }

    .practice-icon {
      width: 40px;
      height: 40px;
      margin-bottom: 12px;
      transition: transform 0.25s ease;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;

        &.invert {
          filter: invert(100%);
        }
      }
    }

    .practice-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-title);
      text-align: center;
      line-height: 1.3;
    }

    .practice-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 60px;
      height: 60px;
      border: 2px solid var(--color-main-green);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      opacity: 0;
      pointer-events: none;
    }
  }
}

@keyframes pulseRing {
  0% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(0.5);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2);
  }
}

// Responsive
@media (max-width: 900px) {
  .quick-access {
    grid-template-columns: 1fr;
  }

  .guide-section .guide-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .help-view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section-header h2 {
    font-size: 18px;
  }

  .practice-section .practice-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

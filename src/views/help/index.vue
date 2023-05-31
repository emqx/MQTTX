<template>
  <div class="help-view rightbar">
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
    <section class="help-top">
      <div v-for="item in helpTop" :key="item.icon" class="card" @click="goToLink(item.link)">
        <img :src="require(`@/assets/images/help/${item.icon}.png`)" :alt="item.icon" width="24" height="24" />
        <h2>{{ item.title }}</h2>
      </div>
    </section>
    <section class="help-guide">
      <h2>{{ $t('help.guideTitle') }}</h2>
      <p>{{ $t('help.guideDesc') }}</p>
      <div class="guide-list">
        <template v-for="item in helpGuide">
          <div v-if="item.link" :key="item.link" class="card" @click="goToLink(`${item.link}${blogUtm}`)">
            <p>{{ item.title }} <span>→</span></p>
          </div>
        </template>
      </div>
    </section>
    <section class="help-practice">
      <h2>{{ $t('help.practiceTitle') }}</h2>
      <p>{{ $t('help.practiceDesc') }}</p>
      <div class="practice-list">
        <template v-for="item in helpPractice">
          <div v-if="item.link" :key="item.icon" class="card" @click="goToLink(`${item.link}${blogUtm}`)">
            <img
              :class="[{ invert: item.invert && item.invert.includes(theme) }]"
              :src="require(`@/assets/images/help/${item.icon}.png`)"
              :alt="item.icon"
              width="32"
              height="32"
            />
            <p>{{ item.title }}</p>
          </div>
        </template>
      </div>
    </section>
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

<style lang="scss" scope>
.help-view {
  position: relative;
  padding: 0 16px;
  > section:not(:last-child) {
    margin-bottom: 64px;
  }
  .help-view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .ebook-link {
      display: block;
    }
  }
  .help-top {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 24px;
    margin-top: 24px;
    text-align: center;
    .card {
      cursor: pointer;
      padding: 24px 12px;
      border-radius: 8px;
      background: var(--color-bg-card-gradient);
      img {
        margin-bottom: 12px;
      }
      h2 {
        font-size: 14px;
      }
    }
  }
  .help-guide,
  .help-practice {
    > h2 {
      margin-bottom: 8px;
      font-size: 18px;
    }
    > p {
      margin-bottom: 24px;
    }
  }
  .help-guide {
    .guide-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-gap: 24px;
      .card {
        cursor: pointer;
        height: 100%;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        color: var(--color-text-title);
        border: 1px solid var(--color-border-default);
        span {
          color: var(--color-main-green);
        }
      }
    }
  }
  .help-practice {
    padding-bottom: 64px;
    .practice-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, 120px);
      grid-gap: 28px;
      text-align: center;
      .card {
        cursor: pointer;
        padding: 24px 12px;
        border-radius: 8px;
        background: var(--color-bg-card-normal);
        img {
          margin-bottom: 12px;
          &.invert {
            filter: invert(100%);
          }
        }
        h2 {
          font-size: 14px;
        }
      }
    }
  }
}
</style>

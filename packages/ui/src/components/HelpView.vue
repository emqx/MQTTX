<script setup lang="ts">
import { useSettingsStore } from '../stores'

const { t, locale } = useI18n()
const { EMQSite, help } = useLinks()
const { settings } = useSettingsStore()

function getImage(path: string): string {
  const images = import.meta.glob<string>('../assets/images/help/*.png', {
    eager: true,
    import: 'default',
  })
  return images[`../assets/images/help/${path}.png`]
}

const helpTop = computed(() => {
  const { learnMQTT, publicMqttBroker, mqtt5 } = help.value
  return [
    {
      icon: 'icon-learn-mqtt',
      title: t('help.learn'),
      link: learnMQTT,
    },
    {
      icon: 'icon-public-mqtt-broker',
      title: t('help.publicMqttBroker'),
      link: publicMqttBroker,
    },
    {
      icon: 'icon-mqtt5',
      title: t('help.mqtt5Explore'),
      link: mqtt5,
    },
  ]
})

const helpGuide = computed(() => [
  {
    title: t('help.guideArticle1'),
    link: `${EMQSite.value}/blog/what-is-the-mqtt-protocol`,
  },
  {
    title: t('help.guideArticle2'),
    link: `${EMQSite.value}/blog/the-easiest-guide-to-getting-started-with-mqtt`,
  },
  {
    title: t('help.guideArticle3'),
    link: `${EMQSite.value}/blog/mqtt-5-introduction-to-publish-subscribe-model`,
  },
  {
    title: t('help.guideArticle4'),
    link: `${EMQSite.value}/blog/how-to-set-parameters-when-establishing-an-mqtt-connection`,
  },
  {
    title: t('help.guideArticle5'),
    link: `${EMQSite.value}/blog/advanced-features-of-mqtt-topics`,
  },
  {
    title: t('help.guideArticle6'),
    link: `${EMQSite.value}/blog/mqtt-session`,
  },
  {
    title: t('help.guideArticle7'),
    link: `${EMQSite.value}/blog/introduction-to-mqtt-qos`,
  },
  {
    title: t('help.guideArticle8'),
    link: `${EMQSite.value}/blog/mqtt5-features-retain-message`,
  },
  {
    title: t('help.guideArticle9'),
    link: `${EMQSite.value}/blog/use-of-mqtt-will-message`,
  },
  {
    title: t('help.guideArticle10'),
    link: `${EMQSite.value}/blog/mqtt-keep-alive`,
  },
])

const helpPractice = computed(() => [
  {
    icon: 'icon-java',
    title: 'Java',
    link: `${EMQSite.value}/blog/how-to-use-mqtt-in-java`,
  },
  {
    icon: 'icon-nodejs',
    title: 'Node.js',
    link: `${EMQSite.value}/blog/how-to-use-mqtt-in-nodejs`,
  },
  {
    icon: 'icon-go',
    title: 'Golang',
    link: `${EMQSite.value}/blog/how-to-use-mqtt-in-golang`,
  },
  {
    icon: 'icon-python',
    title: 'Python',
    link: `${EMQSite.value}/blog/how-to-use-mqtt-in-python`,
  },
  {
    icon: 'icon-php',
    title: 'PHP',
    link: `${EMQSite.value}/blog/how-to-use-mqtt-in-php`,
  },
  {
    icon: 'icon-rust',
    invert: ['dark', 'night'],
    title: 'Rust',
    link: `${EMQSite.value}/blog/how-to-use-mqtt-in-rust`,
  },
  {
    icon: 'icon-javascript',
    title: 'JavaScript',
    link: `${EMQSite.value}/blog/mqtt-js-tutorial`,
  },
  {
    icon: 'icon-vue',
    title: 'Vue.js',
    link: `${EMQSite.value}/blog/how-to-use-mqtt-in-vue`,
  },
  {
    icon: 'icon-react',
    title: 'React',
    link: `${EMQSite.value}/blog/how-to-use-mqtt-in-react`,
  },
  {
    icon: 'icon-angular',
    title: 'Angular',
    link: `${EMQSite.value}/blog/how-to-use-mqtt-in-angular`,
  },
  {
    icon: 'icon-websocket',
    title: 'WebSocket',
    link: `${EMQSite.value}/blog/connect-to-mqtt-broker-with-websocket`,
  },
  {
    icon: 'icon-electron',
    title: 'Electron',
    link: `${EMQSite.value}/blog/how-to-use-mqtt-in-electron`,
  },
  {
    icon: 'icon-mini-program',
    title: t('help.miniProgram'),
    link: locale.value === 'zh' ? `${EMQSite.value}/blog/how-to-use-mqtt-in-wechat-miniprogram` : '',
  },
  {
    icon: 'icon-flutter',
    title: 'Flutter',
    link: `${EMQSite.value}/blog/using-mqtt-in-flutter`,
  },
  {
    icon: 'icon-ios',
    title: 'iOS',
    invert: ['dark', 'night'],
    link: `${EMQSite.value}/blog/ios-mqtt5-client`,
  },
  {
    icon: 'icon-android',
    title: 'Android',
    link: `${EMQSite.value}/blog/android-connects-mqtt-using-kotlin`,
  },
  {
    icon: 'icon-raspberry-pi',
    title: t('help.raspberryPi'),
    link: `${EMQSite.value}/blog/use-mqtt-with-raspberry-pi`,
  },
  {
    icon: 'icon-esp32',
    title: 'ESP32',
    link: `${EMQSite.value}/blog/esp32-connects-to-the-free-public-mqtt-broker`,
  },
  {
    icon: 'icon-esp8266',
    title: 'ESP8266',
    link: `${EMQSite.value}/blog/esp8266_mqtt_led`,
  },
])
</script>

<template>
  <ElScrollbar id="help-view" class="bg-primary min-h-full select-none">
    <div class="px-4 pt-4 pb-12">
      <div class="mx-auto max-w-screen-lg">
        <div class="mb-12 flex justify-between items-center">
          <h1 class="text-lg text-title font-semibold">
            {{ $t('help.helpMQTT') }}
          </h1>
          <ElTooltip
            v-if="locale === 'zh'"
            placement="bottom"
            content="2024 MQTT 协议入门教程"
          >
            <a
              target="_blank"
              rel="noopener"
              class="text-sm text-main-green"
              href="https://www.emqx.com/zh/resources/beginners-guide-to-the-mqtt-protocol?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-mqtt-ebook-zh"
            >
              下载 MQTT 电子书
              <span>→</span>
            </a>
          </ElTooltip>
        </div>

        <section class="mb-16 grid grid-cols-3 gap-6">
          <a
            v-for="item in helpTop"
            :key="item.icon"
            class="block text-center cursor-pointer rounded-lg py-6 px-3 bg-gradient-card"
            :href="item.link"
            target="_blank"
            rel="noopener"
          >
            <img class="mb-3 mx-auto" :src="getImage(item.icon)" :alt="item.icon" width="24" height="24">
            <h2 class="text-title text-sm font-semibold">{{ item.title }}</h2>
          </a>
        </section>

        <section class="mb-16">
          <h2 class="mb-2 text-lg text-title font-semibold">
            {{ $t('help.guideTitle') }}
          </h2>
          <p class="mb-6 text-sm text-default">
            {{ $t('help.guideDesc') }}
          </p>
          <div class="grid grid-cols-2 gap-6">
            <a
              v-for="item in helpGuide"
              :key="item.link"
              class="block cursor-pointer rounded-lg p-4 border border-solid border-border-default"
              :href="`${item.link}${help.blogUtm}`"
              target="_blank"
              rel="noopener"
            >
              <p class="text-title font-semibold text-sm">
                {{ item.title }}
                <span class="text-main-green ml-1">
                  →
                </span>
              </p>
            </a>
          </div>
        </section>

        <section>
          <h2 class="mb-2 text-lg text-title font-semibold">
            {{ $t('help.practiceTitle') }}
          </h2>
          <p class="mb-6 text-sm text-default">
            {{ $t('help.practiceDesc') }}
          </p>
          <div class="grid grid-cols-[repeat(auto-fill,120px)] gap-6">
            <template v-for="item in helpPractice">
              <a
                v-if="item.link"
                :key="item.link"
                class="block cursor-pointer text-center rounded-lg py-6 px-3 bg-card-normal"
                :href="`${item.link}${help.blogUtm}`"
                target="_blank"
                rel="noopener"
              >
                <img
                  class="mb-3 mx-auto"
                  :class="[{ invert: item.invert?.includes(settings?.currentTheme ?? '') }]"
                  :src="getImage(item.icon)"
                  :alt="item.icon"
                  width="32"
                  height="32"
                >
                <p class="text-default text-sm">{{ item.title }}</p>
              </a>
            </template>
          </div>
        </section>
      </div>
    </div>
  </ElScrollbar>
</template>

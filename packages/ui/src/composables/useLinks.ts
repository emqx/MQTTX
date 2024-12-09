export default function useLinks() {
  const { locale } = useI18n()

  const MQTTXSite = computed(() => locale.value === 'zh' ? 'https://mqttx.app/zh' : 'https://mqttx.app')

  const EMQSite = computed(() => {
    if (['en', 'zh', 'ja'].includes(locale.value)) {
      return `https://emqx.com/${locale.value}`
    }
    return 'https://emqx.com/en'
  })

  const forumSite = computed(() => locale.value === 'zh' ? 'https://askemq.com/c/tools/11' : 'https://github.com/emqx/MQTTX/discussions')

  const utm = '?utm_source=mqttx&utm_medium=referral&utm_campaign='

  const leftBarLogo = computed(() => `${MQTTXSite.value}${utm}logo-to-homepage`)

  const empty = computed(() => ({
    EMQX: `${EMQSite.value}/products/emqx${utm}mqttx-to-emqx`,
    EMQXCloud: `${EMQSite.value}/cloud${utm}mqttx-to-cloud`,
  }))

  const about = computed(() => ({
    releases: `${MQTTXSite.value}/changelogs/v${window.__APP_VERSION__}${utm}about-to-release`,
    faq: `${MQTTXSite.value}/docs/faq${utm}about-to-faq`,
    MQTTX: `${MQTTXSite.value}${utm}about-to-mqttx`,
    EMQ: `${EMQSite.value}${utm}mqttx-to-homepage`,
    EMQXCloud: `${EMQSite.value}/cloud${utm}mqttx-to-cloud`,
  }))

  const help = computed(() => ({
    docs: `${MQTTXSite.value}/docs${utm}mqttx-help-to-docs`,
    forum: `${forumSite.value}${utm}mqttx-help-to-forum`,
    learnMQTT: `${EMQSite.value}/mqtt-guide${utm}mqttx-help-to-learn-mqtt`,
    publicMqttBroker: `${EMQSite.value}/mqtt/public-mqtt5-broker`,
    mqtt5: `${EMQSite.value}/mqtt/mqtt5`,
    blogUtm: `${utm}mqttx-help-to-blog`,
  }))

  return {
    MQTTXSite,
    EMQSite,
    forumSite,
    leftBarLogo,
    empty,
    about,
    help,
  }
}

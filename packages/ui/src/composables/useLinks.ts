export default function useLinks() {
  const { locale } = useI18n()

  const MQTTXSite = computed(() => {
    if (['zh', 'ja'].includes(locale.value)) {
      return `https://mqttx.app/${locale.value}`
    }
    return 'https://mqttx.app'
  })

  const EMQSite = computed(() => {
    if (['en', 'zh', 'ja'].includes(locale.value)) {
      return `https://emqx.com/${locale.value}`
    }
    return 'https://emqx.com/en'
  })

  const authSite = computed(() => {
    if (['ja'].includes(locale.value)) {
      return `https://accounts.emqx.com/${locale.value}`
    }
    if (locale.value === 'zh') {
      return 'https://accounts-zh.emqx.com'
    }
    return 'https://accounts.emqx.com'
  })

  const utm = '?utm_source=mqttx&utm_medium=referral&utm_campaign='

  const cloudTrial = computed(() => {
    const query = `${utm}mqttx-to-cloud&continue=https%3A%2F%2Fcloud.emqx.com%2Fconsole%2Fdeployments%2Fnew`
    return `${authSite.value}/signup${query}`
  })

  const forumSite = computed(() => locale.value === 'zh' ? 'https://askemq.com/c/tools/11' : 'https://github.com/emqx/MQTTX/discussions')

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
    EMQXCloud: cloudTrial.value,
  }))

  const help = computed(() => ({
    docs: `${MQTTXSite.value}/docs${utm}mqttx-help-to-docs`,
    forum: `${forumSite.value}${utm}mqttx-help-to-forum`,
    learnMQTT: `${EMQSite.value}/mqtt-guide${utm}mqttx-help-to-learn-mqtt`,
    publicMqttBroker: `${EMQSite.value}/mqtt/public-mqtt5-broker`,
    mqtt5: `${EMQSite.value}/blog/introduction-to-mqtt-5`,
    blogUtm: `${utm}mqttx-help-to-blog`,
  }))

  return {
    MQTTXSite,
    EMQSite,
    authSite,
    cloudTrial,
    forumSite,
    leftBarLogo,
    empty,
    about,
    help,
  }
}

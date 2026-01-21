import version from '@/version'

export default (lang: Language) => {
  const MQTTXENSite = 'https://mqttx.app'
  const MQTTXCNSite = 'https://mqttx.app/zh'
  const MQTTXSite = lang === 'zh' ? MQTTXCNSite : MQTTXENSite

  const EMQENSite = 'https://emqx.com/en'
  const EMQCNSite = 'https://emqx.com/zh'
  const EMQSite = lang === 'zh' ? EMQCNSite : EMQENSite

  const forumENSite = 'https://github.com/emqx/MQTTX/discussions'
  const forumCNSite = 'https://askemq.com/c/tools/11'
  const forumSite = lang === 'zh' ? forumCNSite : forumENSite

  const utm = '?utm_source=mqttx&utm_medium=referral&utm_campaign='

  const leftBarLogo = `${MQTTXSite}${utm}logo-to-homepage`
  const empty = {
    EMQX: `${EMQSite}/products/emqx${utm}mqttx-to-emqx`,
    EMQXCloud: `${EMQSite}/cloud${utm}mqttx-to-cloud`,
  }
  const signInENSite = `https://accounts.emqx.com/signin?continue=https://cloud-intl.emqx.com/console/&utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-signin`
  const signInCNSite = `https://accounts-zh.emqx.com/signin?continue=https://cloud.emqx.com/console/&utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-signin`
  const signInSite = lang === 'zh' ? signInCNSite : signInENSite

  const about = {
    releases: `${MQTTXSite}/changelogs/v${version}${utm}about-to-release`,
    faq: `${MQTTXSite}/docs/faq${utm}about-to-faq`,
    MQTTX: `${MQTTXSite}${utm}about-to-mqttx`,
    EMQ: `${EMQSite}${utm}mqttx-to-homepage`,
    EMQXCloud: `${EMQSite}/cloud${utm}mqttx-to-cloud`,
    EMQXPlatform: `${EMQSite}/platform${utm}mqttx-to-platform`,
    signIn: signInSite,
  }

  const help = {
    docs: `${MQTTXSite}/docs${utm}mqttx-help-to-docs`,
    forum: `${forumSite}${utm}mqttx-help-to-forum`,
    learnMQTT: `${EMQSite}/mqtt-guide${utm}mqttx-help-to-learn-mqtt`,
    publicMqttBroker: `${EMQSite}/mqtt/public-mqtt5-broker`,
    mqtt5: `${EMQSite}/mqtt/mqtt5`,
    blogUtm: `${utm}mqttx-help-to-blog`,
  }

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

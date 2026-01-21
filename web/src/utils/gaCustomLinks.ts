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

  const utm = '?utm_source=mqttx-web&utm_medium=referral&utm_campaign='

  const signInENSite = `https://accounts.emqx.com/signin?continue=https://cloud-intl.emqx.com/console/&utm_source=mqttx-web&utm_medium=referral&utm_campaign=mqttx-web-to-signin`
  const signInCNSite = `https://accounts-zh.emqx.com/signin?continue=https://cloud.emqx.com/console/&utm_source=mqttx-web&utm_medium=referral&utm_campaign=mqttx-web-to-signin`
  const signInSite = lang === 'zh' ? signInCNSite : signInENSite

  const about = {
    faq: `${MQTTXSite}/docs/faq${utm}mqttx-web-about-to-faq`,
    MQTTX: `${MQTTXSite}${utm}mqttx-web-about-to-mqttx`,
    EMQ: `${EMQSite}${utm}mqttx-web-to-homepage`,
    EMQXCloud: `${EMQSite}/cloud${utm}mqttx-web-to-cloud`,
    EMQXPlatform: `${EMQSite}/platform${utm}mqttx-web-to-platform`,
    signIn: signInSite,
  }

  const help = {
    docs: `${MQTTXSite}/docs${utm}mqttx-web-help-to-docs`,
    forum: `${forumSite}${utm}mqttx-web-help-to-forum`,
    learnMQTT: `${EMQSite}/mqtt-guide${utm}mqttx-web-help-to-learn-mqtt`,
    publicMqttBroker: `${EMQSite}/mqtt/public-mqtt5-broker`,
    mqtt5: `${EMQSite}/mqtt/mqtt5`,
    blogUtm: `${utm}mqttx-web-help-to-blog`,
  }

  return {
    MQTTXSite,
    EMQSite,
    forumSite,
    about,
    help,
  }
}

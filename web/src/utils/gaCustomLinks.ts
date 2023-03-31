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

  const help = {
    docs: `${MQTTXSite}/docs${utm}mqttx-web-help-to-docs`,
    forum: `${forumSite}${utm}mqttx-web-help-to-forum`,
    learnMQTT: `${EMQSite}/mqtt${utm}mqttx-web-help-to-learn-mqtt`,
    publicMqttBroker: `${EMQSite}/mqtt/public-mqtt5-broker`,
    mqtt5: `${EMQSite}/mqtt/mqtt5`,
    blogUtm: `${utm}mqttx-web-help-to-blog`,
  }

  return {
    MQTTXSite,
    EMQSite,
    forumSite,
    help,
  }
}

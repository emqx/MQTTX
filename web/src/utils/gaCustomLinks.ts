export default (lang: Language) => {
  const MQTTXENSite = 'https://mqttx.app'
  const MQTTXCNSite = 'https://mqttx.app/zh'
  const MQTTXSite = lang === 'zh' ? MQTTXCNSite : MQTTXENSite

  const EMQENSite = 'https://emqx.com/en'
  const EMQCNSite = 'https://emqx.com/zh'
  const EMQSite = lang === 'zh' ? EMQCNSite : EMQENSite

  return {
    MQTTXSite,
    EMQSite,
  }
}

import version from '@/version'

export default (lang: Language) => {
  const MQTTXENSite = 'https://mqttx.app'
  const MQTTXCNSite = 'https://mqttx.app/zh'
  const MQTTXSite = lang === 'zh' ? MQTTXCNSite : MQTTXENSite

  const EMQENSite = 'https://emqx.com/en'
  const EMQCNSite = 'https://emqx.com/zh'
  const EMQSite = lang === 'zh' ? EMQCNSite : EMQENSite

  const utm = '?utm_source=mqttx&utm_medium=referral&utm_campaign='

  const leftBarLogo = `${MQTTXSite}${utm}logo-to-homepage`
  const empty = {
    EMQXCloud: `${EMQSite}/cloud${utm}mqttx-to-cloud`,
  }
  const about = {
    releases: `${MQTTXSite}/changelogs/v${version}${utm}about-to-release`,
    faq: `${MQTTXSite}/docs/faq${utm}about-to-faq`,
    MQTTX: `${MQTTXSite}${utm}about-to-mqttx`,
    EMQ: `${EMQSite}${utm}mqttx-to-homepage`,
    EMQXCloud: `${EMQSite}/cloud${utm}mqttx-to-cloud`,
  }

  return {
    MQTTXSite,
    EMQSite,
    leftBarLogo,
    empty,
    about,
  }
}

import { expect } from 'chai'
import gaCustomLinks from '@/utils/gaCustomLinks'
import version from '@/version'

describe('gaCustomLinks utility function', () => {
  it('should return correct links for English language', () => {
    const links = gaCustomLinks('en')

    expect(links.MQTTXSite).to.equal('https://mqttx.app')
    expect(links.EMQSite).to.equal('https://emqx.com/en')
    expect(links.forumSite).to.equal('https://github.com/emqx/MQTTX/discussions')

    const utm = '?utm_source=mqttx&utm_medium=referral&utm_campaign='
    expect(links.leftBarLogo).to.equal(`https://mqttx.app${utm}logo-to-homepage`)

    expect(links.empty.EMQX).to.equal(`https://emqx.com/en/products/emqx${utm}mqttx-to-emqx`)
    expect(links.empty.EMQXCloud).to.equal(`https://emqx.com/en/cloud${utm}mqttx-to-cloud`)

    expect(links.about.releases).to.equal(`https://mqttx.app/changelogs/v${version}${utm}about-to-release`)
    expect(links.about.faq).to.equal(`https://mqttx.app/docs/faq${utm}about-to-faq`)
    expect(links.about.MQTTX).to.equal(`https://mqttx.app${utm}about-to-mqttx`)
    expect(links.about.EMQ).to.equal(`https://emqx.com/en${utm}mqttx-to-homepage`)
    expect(links.about.EMQXCloud).to.equal(`https://emqx.com/en/cloud${utm}mqttx-to-cloud`)

    expect(links.help.docs).to.equal(`https://mqttx.app/docs${utm}mqttx-help-to-docs`)
    expect(links.help.forum).to.equal(`https://github.com/emqx/MQTTX/discussions${utm}mqttx-help-to-forum`)
    expect(links.help.learnMQTT).to.equal(`https://emqx.com/en/mqtt-guide${utm}mqttx-help-to-learn-mqtt`)
    expect(links.help.publicMqttBroker).to.equal(`https://emqx.com/en/mqtt/public-mqtt5-broker`)
    expect(links.help.mqtt5).to.equal(`https://emqx.com/en/mqtt/mqtt5`)
    expect(links.help.blogUtm).to.equal(`${utm}mqttx-help-to-blog`)
  })

  it('should return correct links for Chinese language', () => {
    const links = gaCustomLinks('zh')

    expect(links.MQTTXSite).to.equal('https://mqttx.app/zh')
    expect(links.EMQSite).to.equal('https://emqx.com/zh')
    expect(links.forumSite).to.equal('https://askemq.com/c/tools/11')

    const utm = '?utm_source=mqttx&utm_medium=referral&utm_campaign='
    expect(links.leftBarLogo).to.equal(`https://mqttx.app/zh${utm}logo-to-homepage`)

    expect(links.empty.EMQX).to.equal(`https://emqx.com/zh/products/emqx${utm}mqttx-to-emqx`)
    expect(links.empty.EMQXCloud).to.equal(`https://emqx.com/zh/cloud${utm}mqttx-to-cloud`)

    expect(links.about.releases).to.equal(`https://mqttx.app/zh/changelogs/v${version}${utm}about-to-release`)
    expect(links.about.faq).to.equal(`https://mqttx.app/zh/docs/faq${utm}about-to-faq`)
    expect(links.about.MQTTX).to.equal(`https://mqttx.app/zh${utm}about-to-mqttx`)
    expect(links.about.EMQ).to.equal(`https://emqx.com/zh${utm}mqttx-to-homepage`)
    expect(links.about.EMQXCloud).to.equal(`https://emqx.com/zh/cloud${utm}mqttx-to-cloud`)

    expect(links.help.docs).to.equal(`https://mqttx.app/zh/docs${utm}mqttx-help-to-docs`)
    expect(links.help.forum).to.equal(`https://askemq.com/c/tools/11${utm}mqttx-help-to-forum`)
    expect(links.help.learnMQTT).to.equal(`https://emqx.com/zh/mqtt-guide${utm}mqttx-help-to-learn-mqtt`)
    expect(links.help.publicMqttBroker).to.equal(`https://emqx.com/zh/mqtt/public-mqtt5-broker`)
    expect(links.help.mqtt5).to.equal(`https://emqx.com/zh/mqtt/mqtt5`)
    expect(links.help.blogUtm).to.equal(`${utm}mqttx-help-to-blog`)
  })
})

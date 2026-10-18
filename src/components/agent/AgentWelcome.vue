<template>
  <div class="welcome">
    <div class="mark">
      <agent-icon :size="34" colored />
    </div>
    <h2>{{ $t('agent.welcomeTitle') }}</h2>
    <p>{{ $t('agent.welcomeIntro') }}</p>
    <div class="suggestions">
      <button v-for="s in suggestions" :key="s.key" class="suggestion" @click="$emit('suggest', s.prompt)">
        <i class="s-ico" :class="s.icon"></i>
        <span
          >{{ $t(s.titleKey) }}<small>{{ $t(s.hintKey) }}</small></span
        >
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import AgentIcon from './AgentIcon.vue'

@Component({ components: { AgentIcon } })
export default class AgentWelcome extends Vue {
  private suggestions = [
    {
      key: 'connections',
      icon: 'iconfont icon-connections',
      titleKey: 'agent.suggestions.connections',
      hintKey: 'agent.suggestions.readOnly',
      prompt: 'Show my connections and their status',
    },
    {
      key: 'connect',
      icon: 'el-icon-link',
      titleKey: 'agent.suggestions.connect',
      hintKey: 'agent.suggestions.createsConnection',
      prompt: 'Connect to broker.emqx.io and subscribe to testtopic/#',
    },
    {
      key: 'publish',
      icon: 'el-icon-position',
      titleKey: 'agent.suggestions.publish',
      hintKey: 'agent.suggestions.usesCurrent',
      prompt: 'Publish a JSON test message to mqttx/test',
    },
    {
      key: 'explain',
      icon: 'iconfont icon-help',
      titleKey: 'agent.suggestions.explain',
      hintKey: 'agent.suggestions.answerOnly',
      prompt: 'Explain MQTT 5.0 shared subscriptions',
    },
  ]
}
</script>

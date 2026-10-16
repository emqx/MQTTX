<template>
  <div class="welcome">
    <div class="mark">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z" />
        <path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
      </svg>
    </div>
    <h2>{{ $t('agent.welcomeTitle') }}</h2>
    <p>{{ $t('agent.welcomeIntro') }}</p>
    <div class="suggestions">
      <button v-for="s in suggestions" :key="s.key" class="suggestion" @click="$emit('suggest', s.prompt)">
        <span class="s-ico">{{ s.icon }}</span>
        <span
          >{{ $t(s.titleKey) }}<small>{{ $t(s.hintKey) }}</small></span
        >
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class AgentWelcome extends Vue {
  private suggestions = [
    {
      key: 'connections',
      icon: '◎',
      titleKey: 'agent.suggestions.connections',
      hintKey: 'agent.suggestions.readOnly',
      prompt: 'Show my connections and their status',
    },
    {
      key: 'connect',
      icon: '⇄',
      titleKey: 'agent.suggestions.connect',
      hintKey: 'agent.suggestions.createsConnection',
      prompt: 'Connect to broker.emqx.io and subscribe to testtopic/#',
    },
    {
      key: 'publish',
      icon: '↑',
      titleKey: 'agent.suggestions.publish',
      hintKey: 'agent.suggestions.usesCurrent',
      prompt: 'Publish a JSON test message to mqttx/test',
    },
    {
      key: 'explain',
      icon: '?',
      titleKey: 'agent.suggestions.explain',
      hintKey: 'agent.suggestions.answerOnly',
      prompt: 'Explain MQTT 5.0 shared subscriptions',
    },
  ]
}
</script>

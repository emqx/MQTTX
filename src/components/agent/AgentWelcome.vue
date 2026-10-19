<template>
  <div class="welcome">
    <div class="mark">
      <agent-icon :size="34" colored />
    </div>
    <h2>{{ $t('agent.welcomeTitle') }}</h2>
    <p>{{ $t('agent.welcomeIntro') }}</p>
    <div class="suggestions">
      <button v-for="s in suggestions" :key="s.key" class="suggestion" @click="$emit('suggest', message(s))">
        <i class="s-ico" :class="s.icon"></i>
        <span
          >{{ $t(s.titleKey) }}<small>{{ hint(s) }}</small></span
        >
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import AgentIcon from './AgentIcon.vue'
import type { OutgoingMessage } from '@/utils/ai/agent/attachments'
import type { AgentSkillName } from '@/utils/ai/agent/skills'

interface Suggestion {
  key: string
  icon: string
  titleKey: string
  prompt: string
  /** What the suggestion does; a Skill suggestion shows the Skill instead */
  hintKey?: string
  /** Sent with the Skill attached, as if picked from the `/` menu */
  skill?: AgentSkillName
}

@Component({ components: { AgentIcon } })
export default class AgentWelcome extends Vue {
  private suggestions: Suggestion[] = [
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
      key: 'diagnose',
      icon: 'iconfont icon-log',
      titleKey: 'agent.suggestions.diagnose',
      prompt: 'Find out why my connection fails to connect',
      skill: 'mqttx_diagnostics',
    },
    {
      key: 'clientCode',
      icon: 'iconfont icon-script',
      titleKey: 'agent.suggestions.clientCode',
      prompt: 'Write Python client code for my current connection',
      skill: 'client_code',
    },
  ]

  private hint(s: Suggestion): string {
    if (s.skill) return `${this.$t('agent.suggestions.skill')} · ${this.$t(`agent.skills.${s.skill}.name`)}`
    return this.$t(s.hintKey!) as string
  }

  private message(s: Suggestion): string | OutgoingMessage {
    return s.skill ? { content: s.prompt, attachments: [], skill: { skill: s.skill } } : s.prompt
  }
}
</script>

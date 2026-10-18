<template>
  <div class="agent-page"></div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

/**
 * Thin view for the `/agent/:conversationId?` route. The full screen panel is the singleton
 * AgentPanel rendered by Home.vue and covers this view; the route only marks the full screen mode.
 */
@Component
export default class AgentPage extends Vue {}
</script>

<style lang="scss" scoped>
.agent-page {
  height: 100%;
  background: var(--color-bg-primary);
}
</style>

<template>
  <div class="topic-tree-view">topic-tree</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { globalEventBus } from '@/utils/globalEventBus'

@Component
export default class TopicTree extends Vue {
  private handlePacketReceive = (packet: any, connectionInfo: ConnectionModel) => {
    console.log(packet, connectionInfo)
  }

  created() {
    globalEventBus.on('packetReceive', this.handlePacketReceive)
  }

  beforeDestroy() {
    globalEventBus.off('packetReceive', this.handlePacketReceive)
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/mixins.scss';

.topic-tree-view {
  position: relative;
  padding: 0 16px;
}
</style>

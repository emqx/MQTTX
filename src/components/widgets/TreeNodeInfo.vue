<template>
  <div class="tree-node-info">
    <!-- Base node -->
    <div class="tree-node-info-title" v-if="isBaseNode">
      <template v-for="(item, index) in connectionInfoItems">
        <div :key="`label-${index}`">{{ item.label }}</div>
        <div :key="`value-${index}`" class="node-info-item">{{ item.value }}</div>
      </template>
    </div>
    <!-- Full Topic (shown for all nodes except the base node) -->
    <template v-else>
      <div>{{ $t('connections.fullTopic') }}</div>
      <el-tooltip
        :effect="currentTheme !== 'light' ? 'light' : 'dark'"
        :disabled="fullTopicPath.length < 25"
        placement="top"
        :content="fullTopicPath"
        :open-delay="500"
      >
        <div ref="topicPath" class="node-info-item ellipsis">{{ fullTopicPath }}</div>
      </el-tooltip>
    </template>
    <!-- Topic node without payload -->
    <div v-if="!node.message || (node.message && checkPayloadEmpty(node.message.payload))">
      <template v-if="node.subTopicCount === 0 && node.messageCount > 0">
        <el-alert class="no-payload-alert" type="warning" :closable="false">{{
          $t('viewer.noPayloadFromTopicNode')
        }}</el-alert>
      </template>
    </div>
    <!-- Sub topics section -->
    <div v-if="node.subTopicCount > 0">
      <div>{{ $t('connections.subTopics') }}</div>
      <div class="mt-2">
        <el-tag
          v-for="(topic, index) in getSubTopics(node)"
          type="info"
          :key="`${topic}-${index}`"
          size="small"
          class="mr-2 mb-2"
        >
          {{ topic }}
        </el-tag>
      </div>
    </div>
    <!-- Topic node with payload -->
    <div v-if="node.message && !checkPayloadEmpty(node.message.payload)">
      <div>{{ $t('connections.receivedTime') }}</div>
      <div class="node-info-item">{{ node.message.createAt }}</div>
      <div class="flex justify-between">
        <span>Payload <el-tag v-if="node.message.retain" type="info" size="mini">Retained</el-tag></span>
        <span>QoS: {{ node.message.qos }}</span>
      </div>
      <pre
        class="payload-container mt-2 mb-2"
      ><code :class="`language-${payloadFormat}`" v-html="latestMessage"></code></pre>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { findSubTopics, findFullTopicPath, isPayloadEmpty } from '@/utils/topicTree'
import Prism from 'prismjs'
import { jsonStringify, jsonParse } from '@/utils/jsonUtils'

@Component
export default class TreeNodeInfo extends Vue {
  @Prop() private node!: TopicTreeNode
  @Prop() private treeData!: TopicTreeNode[]

  @Getter('currentTheme') private currentTheme!: Theme

  get isBaseNode() {
    return this.node.connectionInfo !== undefined
  }

  get latestMessage(): string {
    const payload = this.node.message?.payload || ''
    if (this.payloadFormat === 'json') {
      return jsonStringify(jsonParse(payload.toString()), null, 2)
    }
    return payload.toString()
  }

  get payloadFormat(): string {
    try {
      const message = this.node.message?.payload || ''
      JSON.parse(message.toString())
      return 'json'
    } catch (e) {
      return 'plaintext'
    }
  }

  get fullTopicPath(): string {
    return this.getFullTopicPath(this.node)
  }

  get connectionInfoItems() {
    if (!this.node.connectionInfo) return []
    const { name, clientId } = this.node.connectionInfo
    return [
      { label: this.$t('connections.name'), value: name },
      { label: this.$t('connections.brokerIP'), value: this.getFullHost(this.node.connectionInfo) },
      { label: 'Client ID', value: clientId },
    ]
  }

  private getFullHost(connectionInfo: ConnectionModel) {
    const { protocol, host, port, path } = connectionInfo
    let fullHost = `${protocol}://${host}:${port}`
    if (protocol && ['ws', 'wss'].includes(protocol) && path) {
      fullHost += `${path}`
    }
    return fullHost
  }

  private getSubTopics(node: TopicTreeNode): string[] {
    return findSubTopics(node)
  }

  private getFullTopicPath(node: TopicTreeNode): string {
    const fullPath = findFullTopicPath(this.treeData, node.id)
    if (!fullPath) return node.label
    return fullPath
  }

  private checkPayloadEmpty(payload: string | Buffer | null | undefined): boolean {
    return isPayloadEmpty(payload)
  }

  private mounted() {
    this.$nextTick(() => {
      Prism.highlightAllUnder(this.$el)
    })
  }

  private updated() {
    this.$nextTick(() => {
      Prism.highlightAllUnder(this.$el)
    })
  }
}
</script>

<style lang="scss">
@import '@/assets/scss/mixins.scss';

body.light {
  @import '@/assets/scss/theme/custom/prism-one-light.scss';
}
body.dark,
body.night {
  @import '@/assets/scss/theme/custom/prism-one-dark.scss';
}

.tree-node-info {
  .el-tag.el-tag--info {
    color: var(--color-text-default);
  }
  .node-info-item {
    background-color: var(--color-bg-select_lang);
    padding: 6px 12px;
    margin: 6px 0 12px 0;
    border-radius: 8px;
  }
  .no-payload-alert {
    padding: 6px 12px;
    .el-alert__content {
      padding: 0;
    }
  }
  .payload-container {
    max-height: 320px;
    overflow-y: auto;
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    width: 100%;
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
}
</style>

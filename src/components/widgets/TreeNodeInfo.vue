<template>
  <div class="tree-node-info">
    <!-- Base node -->
    <div class="tree-node-info-title" v-if="isBaseNode">
      <template v-for="(item, index) in connectionInfoItems">
        <div :key="`label-${index}`">{{ item.label }}</div>
        <div :key="`value-${index}`" class="node-info-item">{{ item.value }}</div>
      </template>
      <div>{{ $t('connections.subTopics') }}</div>
      <div class="mt-2">
        <el-tag v-for="topic in getSubTopics(node)" :key="topic" size="small" class="mr-2 mb-2">
          {{ topic }}
        </el-tag>
      </div>
    </div>
    <!-- Topic node without payload -->
    <div v-else-if="!node.latestMessage">
      <div>{{ $t('connections.fullTopic') }}</div>
      <el-tooltip
        :effect="currentTheme !== 'light' ? 'light' : 'dark'"
        :disabled="fullTopicPath.length < 20"
        placement="top"
        :content="fullTopicPath"
        :open-delay="500"
      >
        <div ref="topicPath" class="node-info-item ellipsis">{{ fullTopicPath }}</div>
      </el-tooltip>
      <div>{{ $t('connections.subTopics') }}</div>
      <div class="mt-2">
        <el-tag v-for="topic in getSubTopics(node)" :key="topic" size="small" class="mr-2 mb-2">
          {{ topic }}
        </el-tag>
      </div>
    </div>
    <!-- Topic node with payload -->
    <div v-else>
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
      <div>{{ $t('connections.receivedTime') }}</div>
      <div class="node-info-item">{{ node.time }}</div>
      <div class="flex justify-between">
        <span>Payload <el-tag v-if="node.retain" type="info" size="mini">Retained</el-tag></span>
        <span>QoS: {{ node.qos }}</span>
      </div>
      <div class="payload-container mt-2 mb-2">
        <pre><code :class="`language-${payloadFormat}`" v-html="latestMessage"></code></pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { findSubTopics, findFullTopicPath } from '@/utils/topicTree'
import Prism from 'prismjs'

@Component
export default class TreeNodeInfo extends Vue {
  @Prop() private node!: TopicTreeData
  @Prop() private treeData!: TopicTreeData[]

  @Getter('currentTheme') private currentTheme!: Theme

  get isBaseNode() {
    return this.node.connectionInfo !== undefined
  }

  get latestMessage(): string {
    if (this.payloadFormat === 'json') {
      return JSON.stringify(JSON.parse(this.node.latestMessage || ''), null, 2)
    }
    return this.node.latestMessage || ''
  }

  get payloadFormat(): string {
    try {
      JSON.parse(this.latestMessage)
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

  private getSubTopics(node: TopicTreeData): string[] {
    return findSubTopics(node)
  }

  private getFullTopicPath(node: TopicTreeData): string {
    const fullPath = findFullTopicPath(this.treeData, node.label)
    return fullPath || node.label
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
body.light {
  @import '@/assets/scss/theme/custom/prism-one-light.scss';
}
body.dark,
body.night {
  @import '@/assets/scss/theme/custom/prism-one-dark.scss';
}

.tree-node-info {
  .node-info-item {
    background-color: var(--color-bg-select_lang);
    padding: 6px 12px;
    margin: 6px 0 12px 0;
    border-radius: 8px;
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

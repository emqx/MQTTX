<template>
  <el-select
    v-model="modelValue"
    class="topic-select"
    v-bind="$attrs"
    :style="{ width }"
    popper-class="topic-select__popper"
    filterable
    allow-create
    default-first-option
    :placeholder="$t('common.selectRequired')"
  >
    <el-option v-for="topic in topics" :key="topic" :label="topic" :value="topic">
      <span style="float: left">{{ topic }}</span>
    </el-option>
  </el-select>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import useServices from '@/database/useServices'

@Component
export default class TopicSelect extends Vue {
  @Prop({ type: String, default: '' }) readonly value!: string
  @Prop({ default: '300px' }) private width!: string
  @Prop({ type: String, required: true }) private connectionId!: string

  private topics: string[] = []
  private modelValue = this.value

  @Watch('value')
  private onValueChange(newVal: string) {
    this.modelValue = newVal
  }

  @Watch('modelValue')
  private onModelValueChange(newVal: string) {
    this.$emit('input', newVal)
    this.$emit('change', newVal)
  }

  @Watch('connectionId')
  private async onConnectionIdChange(newVal: string) {
    if (newVal) {
      await this.loadTopics()
    } else {
      this.topics = []
    }
  }

  private async loadTopics() {
    if (!this.connectionId) {
      this.topics = []
      return
    }

    const { messageService } = useServices()
    try {
      this.topics = (await messageService.getAllTopics(this.connectionId)) ?? []
    } catch (error) {
      this.$log.error(`TopicSelect: load topics failed: ${error}`)
      this.topics = []
    }
  }

  private async created() {
    if (this.connectionId) {
      await this.loadTopics()
    }
  }
}
</script>

<style lang="scss">
.topic-select {
  -webkit-app-region: no-drag;
}
</style>

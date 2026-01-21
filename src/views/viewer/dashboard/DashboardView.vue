<template>
  <div class="dashboard-canvas-root">
    <div class="dashboard-canvas-grid">
      <grid-layout
        :layout="layout"
        :col-num="12"
        :row-height="30"
        :is-draggable="true"
        :is-resizable="true"
        :is-responsive="false"
        :vertical-compact="true"
        :use-css-transforms="true"
        @layout-updated="onLayoutUpdated"
      >
        <grid-item
          v-for="widget in widgets"
          :key="widget.id"
          :x="widget.x"
          :y="widget.y"
          :w="widget.w"
          :h="widget.h"
          :i="String(widget.id)"
          :static="widget.static"
          class="grid-item-tem"
          @resized="onItemResized"
          @resize="onItemResizing"
        >
          <div class="widget-card">
            <div class="widget-header">
              <div class="widget-title-container">
                <div class="widget-title" :title="widget.title || ''">{{ widget.title || '' }}</div>
                <el-tooltip
                  v-if="widget.schemaValidationState === 'invalid'"
                  :content="getSchemaErrorTooltip(widget)"
                  placement="top"
                  effect="dark"
                  :disabled="!widget.schemaValidationError"
                >
                  <div class="widget-warning">
                    <i class="el-icon-warning"></i>
                    <span class="warning-text">Schema Error</span>
                  </div>
                </el-tooltip>
              </div>
              <el-dropdown @command="onWidgetMenuCommand($event, widget)" popper-class="dashboard-widget-dropdown">
                <span class="widget-menu-trigger" title="Options">
                  <i class="el-icon-more"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit">
                    <i class="iconfont icon-edit"></i>
                    Edit
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" class="is-danger">
                    <i class="iconfont icon-delete"></i>
                    Delete
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <div class="widget-body">
              <WidgetRenderer
                :widget="widget"
                :data="getWidgetData(widget)"
                :duration="duration"
                :time-range-type="timeRangeType"
                @error="onWidgetError"
              />
            </div>
          </div>
        </grid-item>
      </grid-layout>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import '@/assets/font/iconfont'
import { GridLayout, GridItem } from 'vue-grid-layout'
import WidgetRenderer from '@/widgets/WidgetRenderer.vue'
import { globalEventBus } from '@/utils/globalEventBus'
import { matchTopicMethod } from '@/utils/topicMatch'
import time from '@/utils/time'
import moment from 'moment'
import { Packet, IPublishPacket } from 'mqtt'
import { MessageQueue } from '@/utils/messageQueue'
import { deserializeBufferToProtobuf } from '@/utils/protobuf'
import { deserializeBufferToAvro } from '@/utils/avro'
import useServices from '@/database/useServices'
import { Subscription } from 'rxjs'

interface WidgetDataEntry {
  data: BigNumberData | GaugeData | LineData
  validationState: 'valid' | 'invalid'
  schemaError?: string
  lastUpdate: number
}

interface TimeRangeConfig {
  start: string
  end: string
}

@Component({
  components: {
    GridLayout,
    GridItem,
    WidgetRenderer,
  },
})
export default class DashboardCanvas extends Vue {
  @Prop({ type: String, required: false, default: null }) readonly dashboardId!: string | null
  @Prop({ type: Array, default: () => [] }) readonly widgets!: WidgetModel[]
  @Prop({ type: Array, default: () => ['', ''] }) readonly timeRange!: [string, string]
  @Prop({ type: String, default: 'static' }) readonly timeRangeType!: 'live' | 'static'
  @Prop({ type: Number, default: 24 * 60 }) readonly duration!: number

  private widgetDataStore: Record<string, WidgetDataEntry> = {}
  private messageQueue: MessageQueue<TimeSeriesDataPoint & { widgetId: string }> | null = null
  private subscription: Subscription | null = null
  private isLoadingHistoricalData: boolean = false
  private scriptService = useServices().scriptService
  private updateTimeouts: Map<string, NodeJS.Timeout> = new Map()

  get layout() {
    return this.widgets.map((widget) => ({
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      i: String(widget.id),
      static: widget.static,
      minW: widget.minW,
      minH: widget.minH,
      maxW: widget.maxW,
      maxH: widget.maxH,
    }))
  }

  @Watch('widgets', { deep: true })
  onWidgetsChanged(newWidgets: WidgetModel[], oldWidgets: WidgetModel[]) {
    this.cleanupRemovedWidgets(newWidgets, oldWidgets)
    this.syncWidgetSchemaStates()
  }

  @Watch('timeRange')
  async onTimeRangeChanged(newRange: [string, string]) {
    if (newRange[0] && newRange[1]) {
      this.isLoadingHistoricalData = true
      await this.loadHistoricalData()
      this.isLoadingHistoricalData = false
    }
  }

  @Watch('timeRangeType')
  async onTimeRangeTypeChanged(newType: 'live' | 'static') {
    if (this.timeRange[0] && this.timeRange[1]) {
      this.isLoadingHistoricalData = true
      await this.loadHistoricalData()
      this.isLoadingHistoricalData = false
    }
  }

  @Watch('duration')
  async onDurationChanged(newDuration: number) {
    if (this.timeRangeType === 'live' && this.timeRange[0] && this.timeRange[1]) {
      this.isLoadingHistoricalData = true
      await this.loadHistoricalData()
      this.isLoadingHistoricalData = false
    }
  }

  private async mounted() {
    await this.initializeComponent()
  }

  private beforeDestroy() {
    this.cleanup()
  }

  private async initializeComponent(): Promise<void> {
    this.isLoadingHistoricalData = true

    this.initializeMessageQueue()
    this.subscribeToGlobalEvents()
    await this.loadHistoricalData()

    this.isLoadingHistoricalData = false
  }

  private initializeMessageQueue(): void {
    this.messageQueue = new MessageQueue<TimeSeriesDataPoint & { widgetId: string }>(1000)
    this.subscribeToMessageQueue()
  }

  private subscribeToGlobalEvents(): void {
    globalEventBus.on('packetReceive', this.handlePacketReceive)
  }

  private subscribeToMessageQueue(): void {
    this.subscription = this.messageQueue
      ?.getMessageObservable()
      .subscribe(async (dataPoints: (TimeSeriesDataPoint & { widgetId: string })[]) => {
        await this.processBatchedDataPoints(dataPoints)
      }) as Subscription | null
  }

  private clearAllWidgetData(): void {
    this.widgetDataStore = {}
  }

  private async loadHistoricalData(): Promise<void> {
    if (!this.widgets.length) {
      return
    }

    this.clearAllWidgetData()

    try {
      const { messageService } = useServices()
      const timeRange = this.calculateHistoricalTimeRange()

      for (const widget of this.widgets) {
        if (!widget.topicPattern || !widget.connectionId) {
          continue
        }

        const messages = await messageService.getMessagesByTopicPattern<MessageModel>(
          widget.connectionId,
          widget.topicPattern,
          {
            startTime: timeRange.start,
            endTime: timeRange.end,
            limit: 1000,
          },
        )

        await this.processHistoricalMessages(widget, messages)
      }

      await this.finalizeHistoricalDataLoad()
    } catch (error) {
      console.error('❌ DashboardView: Error in loadHistoricalData:', error)
      this.handleError(error as Error, 'Historical data loading')
    }
  }

  private calculateHistoricalTimeRange(): TimeRangeConfig {
    if (this.timeRangeType === 'static' && this.timeRange) {
      return { start: this.timeRange[0], end: this.timeRange[1] }
    }

    if (this.timeRangeType === 'live' && this.duration) {
      const now = new Date()
      const start = new Date(now.getTime() - this.duration * 60 * 1000)
      const result = {
        start: time.toFormat(start),
        end: time.toFormat(now),
      }

      return result
    }

    return {
      start: time.getDateBefore(24 * 60),
      end: time.getNowDate(),
    }
  }

  private async processHistoricalMessages(widget: WidgetModel, messages: MessageModel[]): Promise<void> {
    const widgetId = String(widget.id)

    let processedCount = 0
    for (const message of messages) {
      try {
        const payload = Buffer.from(message.payload)
        const extractedValues = await this.extractValuesFromPayload(payload, widget)

        const dataPoint: TimeSeriesDataPoint & { widgetId: string } = {
          timestamp: message.createAt,
          values: extractedValues,
          topic: message.topic,
          connectionId: widget.connectionId!,
          metadata: { qos: message.qos, retain: message.retain },
          widgetId: widgetId,
        }

        this.updateWidgetDataHistorical(widgetId, dataPoint)
        processedCount++
      } catch (error) {
        this.handleSchemaError(widgetId, error as Error)
      }
    }
  }

  private updateWidgetDataHistorical(widgetId: string, dataPoint: TimeSeriesDataPoint): void {
    const entry = this.getOrCreateWidgetEntry(widgetId)
    const widget = this.widgets.find((w) => String(w.id) === widgetId)
    if (!widget) return

    this.updateWidgetByTypeHistorical(widget, entry.data, dataPoint)
    entry.lastUpdate = Date.now()

    this.$set(this.widgetDataStore, widgetId, { ...entry })
  }

  private updateWidgetByTypeHistorical(
    widget: WidgetModel,
    data: BigNumberData | GaugeData | LineData,
    dataPoint: TimeSeriesDataPoint,
  ): void {
    const { value: primaryValue, fieldName } = this.extractPrimaryValue(dataPoint, widget)

    switch (widget.type) {
      case 'Big Number':
        this.updateBigNumberDataHistorical(data as BigNumberData, primaryValue, dataPoint, fieldName)
        break
      case 'Gauge':
        this.updateGaugeData(data as GaugeData, primaryValue, dataPoint, fieldName)
        break
      case 'Line':
        this.updateLineDataHistorical(data as LineData, primaryValue, dataPoint)
        break
    }
  }

  private updateBigNumberDataHistorical(
    data: BigNumberData,
    value: number,
    dataPoint: TimeSeriesDataPoint,
    fieldName: string,
  ): void {
    data.value = value
    data.fieldName = fieldName

    const timestamp = dataPoint.timestamp
    data.chartData.xData.push(timestamp)
    data.chartData.seriesData[0].data.push(value)
  }

  private updateLineDataHistorical(data: LineData, value: number, dataPoint: TimeSeriesDataPoint): void {
    const timestamp = dataPoint.timestamp
    data.chartData.xData.push(timestamp)
    data.chartData.seriesData[0].data.push(value)
  }

  private async finalizeHistoricalDataLoad(): Promise<void> {
    if (this.timeRangeType === 'live' && this.duration) {
      Object.keys(this.widgetDataStore).forEach((widgetId) => {
        const entry = this.widgetDataStore[widgetId]
        if (entry && entry.data) {
          this.applyDurationFilter(entry.data, this.duration)
          this.$set(this.widgetDataStore, widgetId, { ...entry })
        }
      })
    }
  }

  private async handlePacketReceive(packet: Packet, connectionInfo: ConnectionModel): Promise<void> {
    if (packet.cmd !== 'publish') return

    if (this.isLoadingHistoricalData) {
      return
    }

    const publishPacket = packet as IPublishPacket

    if (!this.shouldProcessMessage(publishPacket)) {
      return
    }

    const matchingWidgets = this.getMatchingWidgets(publishPacket, connectionInfo)

    if (matchingWidgets.length === 0) return

    const dataPoints = await Promise.all(
      matchingWidgets.map((widget) => this.createDataPoint(publishPacket, connectionInfo, widget)),
    )

    const validDataPoints = dataPoints.filter(Boolean)
    validDataPoints.forEach((dataPoint) => {
      this.messageQueue?.queueMessage(dataPoint!)
    })
  }

  private shouldProcessMessage(packet: IPublishPacket): boolean {
    const messageTime = new Date().getTime()

    if (this.timeRangeType === 'live' && this.duration) {
      const cutoffTime = messageTime - this.duration * 60 * 1000
      return messageTime >= cutoffTime
    }

    if (this.timeRangeType === 'static' && this.timeRange) {
      const startTime = new Date(this.timeRange[0]).getTime()
      const endTime = new Date(this.timeRange[1]).getTime()
      return messageTime >= startTime && messageTime <= endTime
    }

    return true
  }

  private getMatchingWidgets(packet: IPublishPacket, connectionInfo: ConnectionModel): WidgetModel[] {
    return this.widgets.filter(
      (widget) =>
        widget.topicPattern &&
        matchTopicMethod(packet.topic, widget.topicPattern) &&
        widget.connectionId === connectionInfo.id,
    )
  }

  private async createDataPoint(
    packet: IPublishPacket,
    connectionInfo: ConnectionModel,
    widget: WidgetModel,
  ): Promise<(TimeSeriesDataPoint & { widgetId: string }) | null> {
    try {
      const payload = Buffer.isBuffer(packet.payload) ? packet.payload : Buffer.from(packet.payload)
      const extractedValues = await this.extractValuesFromPayload(payload, widget)

      return {
        timestamp: time.getNowDate(),
        values: extractedValues,
        topic: packet.topic,
        connectionId: connectionInfo.id as string,
        metadata: { qos: packet.qos, retain: packet.retain },
        widgetId: String(widget.id),
      }
    } catch (error) {
      this.handleSchemaError(String(widget.id), error as Error)
      return null
    }
  }

  private async processBatchedDataPoints(dataPoints: (TimeSeriesDataPoint & { widgetId: string })[]): Promise<void> {
    const widgetGroups = new Map<string, TimeSeriesDataPoint[]>()

    dataPoints.forEach((point) => {
      const existing = widgetGroups.get(point.widgetId) || []
      existing.push(point)
      widgetGroups.set(point.widgetId, existing)
    })

    for (const [widgetId, points] of widgetGroups) {
      points.forEach((point) => this.updateWidgetData(widgetId, point))
    }
  }

  private getOrCreateWidgetEntry(widgetId: string): WidgetDataEntry {
    if (!this.widgetDataStore[widgetId]) {
      const widget = this.widgets.find((w) => String(w.id) === widgetId)
      if (!widget) throw new Error(`Widget not found: ${widgetId}`)

      this.$set(this.widgetDataStore, widgetId, {
        data: this.createInitialWidgetData(widget.type),
        validationState: 'valid',
        lastUpdate: Date.now(),
      })
    }
    return this.widgetDataStore[widgetId]
  }

  private updateWidgetData(widgetId: string, dataPoint: TimeSeriesDataPoint): void {
    const entry = this.getOrCreateWidgetEntry(widgetId)
    const widget = this.widgets.find((w) => String(w.id) === widgetId)
    if (!widget) return

    if (this.timeRangeType === 'live' && this.duration) {
      this.applyDurationFilter(entry.data, this.duration)
    }

    this.updateWidgetByType(widget, entry.data, dataPoint)
    entry.lastUpdate = Date.now()

    this.$set(this.widgetDataStore, widgetId, { ...entry })
  }

  private updateWidgetByType(
    widget: WidgetModel,
    data: BigNumberData | GaugeData | LineData,
    dataPoint: TimeSeriesDataPoint,
  ): void {
    const { value: primaryValue, fieldName } = this.extractPrimaryValue(dataPoint, widget)

    switch (widget.type) {
      case 'Big Number':
        this.updateBigNumberData(data as BigNumberData, primaryValue, dataPoint, fieldName)
        break
      case 'Gauge':
        this.updateGaugeData(data as GaugeData, primaryValue, dataPoint, fieldName)
        break
      case 'Line':
        this.updateLineData(data as LineData, primaryValue, dataPoint)
        break
    }
  }

  private applyDurationFilter(data: BigNumberData | GaugeData | LineData, durationMinutes: number): void {
    if (!durationMinutes || !('chartData' in data) || !data.chartData) return

    const cutoffTime = Date.now() - durationMinutes * 60 * 1000
    const validIndices: number[] = []

    data.chartData.xData.forEach((timestamp, index) => {
      const time = new Date(timestamp).getTime()
      if (time >= cutoffTime) {
        validIndices.push(index)
      }
    })

    if (validIndices.length < data.chartData.xData.length) {
      data.chartData.xData = validIndices.map((i) => data.chartData!.xData[i])
      data.chartData.seriesData.forEach((series) => {
        series.data = validIndices.map((i) => series.data[i])
      })
    }
  }

  private syncWidgetSchemaStates(): void {
    this.widgets.forEach((widget) => {
      if (widget.schemaValidationState === 'invalid') {
        this.$forceUpdate()
      }
    })
  }

  private cleanupRemovedWidgets(newWidgets: WidgetModel[], oldWidgets: WidgetModel[]): void {
    if (!oldWidgets) return

    const oldIds = new Set(oldWidgets.map((w) => String(w.id)))
    const newIds = new Set(newWidgets.map((w) => String(w.id)))

    oldIds.forEach((id) => {
      if (!newIds.has(id)) {
        this.$delete(this.widgetDataStore, id)
      }
    })
  }

  private getWidgetData(widget: WidgetModel): BigNumberData | GaugeData | LineData | undefined {
    const widgetId = String(widget.id)
    return this.widgetDataStore[widgetId]?.data
  }

  private getSchemaErrorTooltip(widget: WidgetModel): string {
    if (!widget.schemaValidationError) {
      return 'Schema validation is failing'
    }

    const error = widget.schemaValidationError
    const schemaType = widget.schemaType || 'Unknown'
    const schemaId = widget.schemaId || 'Unknown'
    const topicPattern = widget.topicPattern || 'Unknown'

    const formattedError = error.length > 100 ? error.substring(0, 100) + '...' : error

    return `Schema error: ${formattedError}`
  }

  private handleError(error: Error, context: string): void {
    console.error(`DashboardCanvas ${context}:`, error)
    this.$log?.error(`DashboardCanvas ${context}: ${error.message}`)
    this.$emit('error', { context, error: error.message })
  }

  private handleSchemaError(widgetId: string, error: Error): void {
    const entry = this.widgetDataStore[widgetId]
    if (entry) {
      entry.validationState = 'invalid'
      entry.schemaError = error.message
      this.$set(this.widgetDataStore, widgetId, { ...entry })
    }
    this.handleError(error, `Schema processing for widget ${widgetId}`)
  }

  private cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }

    globalEventBus.off('packetReceive', this.handlePacketReceive)

    if (this.messageQueue) {
      this.messageQueue = null
    }

    this.updateTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.updateTimeouts.clear()

    Object.keys(this.widgetDataStore).forEach((key) => {
      this.$delete(this.widgetDataStore, key)
    })
  }

  private updateBigNumberData(
    data: BigNumberData,
    value: number,
    dataPoint: TimeSeriesDataPoint,
    fieldName: string,
  ): void {
    data.value = value
    data.fieldName = fieldName

    const timestamp = dataPoint.timestamp
    data.chartData.xData.push(timestamp)
    data.chartData.seriesData[0].data.push(value)

    if (this.timeRangeType === 'live' && this.duration) {
      this.applyDurationFilter(data, this.duration)
    } else {
      if (data.chartData.xData.length > 30) {
        data.chartData.xData.shift()
        data.chartData.seriesData[0].data.shift()
      }
    }
  }

  private updateGaugeData(data: GaugeData, value: number, dataPoint: TimeSeriesDataPoint, fieldName: string): void {
    data.value = value
    data.fieldName = fieldName
  }

  private updateLineData(data: LineData, value: number, dataPoint: TimeSeriesDataPoint): void {
    const timestamp = dataPoint.timestamp
    data.chartData.xData.push(timestamp)
    data.chartData.seriesData[0].data.push(value)

    if (this.timeRangeType === 'live' && this.duration) {
      this.applyDurationFilter(data, this.duration)
    } else {
      if (data.chartData.xData.length > 50) {
        data.chartData.xData.shift()
        data.chartData.seriesData[0].data.shift()
      }
    }
  }

  private onLayoutUpdated(layout: any[]): void {
    this.emitLayoutChanged(layout)
  }

  private emitLayoutChanged(layout: any[]): void {
    this.$emit('layout-changed', layout)
  }

  private onItemResized(...args: any[]): void {
    const i = String(args[0])
    const newH = Number(args[1])
    const newW = Number(args[2])
    const nextLayout = this.widgets.map((w) => ({
      x: w.x,
      y: w.y,
      w: String(w.id) === i ? newW : w.w,
      h: String(w.id) === i ? newH : w.h,
      i: String(w.id),
      static: w.static,
      minW: w.minW,
      minH: w.minH,
      maxW: w.maxW,
      maxH: w.maxH,
    }))
    this.$emit('layout-changed', nextLayout)
  }

  private onItemResizing(...args: any[]): void {
    this.onItemResized(...args)
  }

  private onWidgetMenuCommand(cmd: string, widget: WidgetModel): void {
    this.handleWidgetCommand(cmd, widget)
  }

  private handleWidgetCommand(cmd: string, widget: WidgetModel): void {
    if (cmd === 'edit') {
      this.$emit('edit-widget', widget)
    } else if (cmd === 'delete') {
      if (widget.id) this.$emit('remove-widget', String(widget.id))
    }
  }

  private onWidgetError(error: Error, widget: WidgetModel): void {
    this.$emit('widget-error', { error, widget })
  }

  removeItem(itemId: string): void {
    this.$delete(this.widgetDataStore, itemId)
    this.$emit('remove-widget', itemId)
  }

  private async extractValuesFromPayload(payload: Buffer, widget: WidgetModel): Promise<{ [fieldName: string]: any }> {
    try {
      if (widget.schemaType && widget.schemaId) {
        return await this.extractFromSchema(payload, widget)
      }

      if (widget.valueField && widget.valueField.trim() !== '' && this.isJsonPayload(payload)) {
        const parsed = JSON.parse(payload.toString())
        const allFields: { [fieldName: string]: any } = {}
        this.flattenObject(parsed, '', allFields)
        return allFields
      }

      const payloadString = payload.toString()
      const numValue = parseFloat(payloadString)
      const fieldName = widget.valueField ?? 'value'

      return {
        [fieldName]: isNaN(numValue) ? widget.fallbackValue : numValue,
      }
    } catch (error) {
      const fieldName = widget.valueField ?? 'value'
      return { [fieldName]: widget.fallbackValue }
    }
  }

  private async extractFromSchema(payload: Buffer, widget: WidgetModel): Promise<{ [fieldName: string]: any }> {
    try {
      if (!widget.schemaId) {
        throw new Error('Schema ID is required for schema-based extraction')
      }

      const schema = await this.scriptService.get(widget.schemaId)
      if (!schema) {
        throw new Error(`Schema not found: ${widget.schemaId}`)
      }

      let deserializedData: any

      switch (widget.schemaType) {
        case 'protobuf':
          deserializedData = this.deserializeWithSchema(payload, schema.script, 'protobuf', widget.schemaMessageName)
          break

        case 'avro':
          deserializedData = this.deserializeWithSchema(payload, schema.script, 'avro')
          break

        default:
          throw new Error(`Unsupported schema type: ${widget.schemaType}`)
      }

      if (Buffer.isBuffer(deserializedData)) {
        deserializedData = JSON.parse(deserializedData.toString())
      } else if (typeof deserializedData === 'string') {
        if (deserializedData.startsWith('{') && deserializedData.endsWith('}')) {
          deserializedData = JSON.parse(deserializedData)
        } else {
          deserializedData = this.extractValuesFromProtobufString(deserializedData)
        }
      }

      const result = this.extractAllFields(deserializedData, widget.valueField)
      await this.updateWidgetSchemaValidationState(widget, 'valid', null)
      return result
    } catch (error) {
      await this.updateWidgetSchemaValidationState(widget, 'invalid', (error as Error).message)
      const fieldName = widget.valueField || 'value'
      return { [fieldName]: widget.fallbackValue }
    }
  }

  private extractAllFields(data: any, specificField?: string): { [fieldName: string]: any } {
    const result: { [fieldName: string]: any } = {}
    this.flattenObject(data, '', result)
    return result
  }

  private extractValuesFromProtobufString(protobufString: string): Record<string, any> {
    try {
      const match = protobufString.match(/(\w+)\s*\{([^}]+)\}/)
      if (match) {
        const [, messageName, fieldsString] = match
        const values: Record<string, any> = {}

        const fieldMatches = fieldsString.matchAll(/(\w+):\s*([^,}]+)/g)
        for (const fieldMatch of fieldMatches) {
          const [, fieldName, fieldValue] = fieldMatch
          values[fieldName] = this.parseFieldValue(fieldValue.trim())
        }

        values._messageType = messageName
        return values
      }

      const numericMatches = protobufString.matchAll(/(\w+):\s*([0-9.-]+)/g)
      const values: Record<string, any> = {}
      for (const match of numericMatches) {
        const [, fieldName, fieldValue] = match
        values[fieldName] = this.parseFieldValue(fieldValue)
      }

      return values
    } catch (error) {
      return {}
    }
  }

  private parseFieldValue(value: string): any {
    const cleanValue = value.replace(/^["']|["']$/g, '')

    const numValue = parseFloat(cleanValue)
    if (!isNaN(numValue)) {
      return numValue
    }

    if (cleanValue.toLowerCase() === 'true') return true
    if (cleanValue.toLowerCase() === 'false') return false

    return cleanValue
  }

  private flattenObject(obj: any, prefix: string, result: { [key: string]: any }): void {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      const value = obj[key]

      if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || value === null) {
        result[fullKey] = value
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.flattenObject(value, fullKey, result)
      }
    }
  }

  private isJsonPayload(payload: Buffer): boolean {
    try {
      const str = payload.toString().trim()
      return (str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))
    } catch {
      return false
    }
  }

  private deserializeWithSchema(
    payload: Buffer,
    rawSchema: string,
    schemaType: SchemaType,
    protobufMessageName?: string,
    format?: PayloadType,
  ): string | Buffer {
    switch (schemaType) {
      case 'protobuf':
        if (!protobufMessageName) {
          this.$message.error('Deserialization: No protobuf message name found when deserializing message.')
          return payload
        }
        return deserializeBufferToProtobuf(payload, rawSchema, protobufMessageName, 'JSON')

      case 'avro':
        return deserializeBufferToAvro(payload, rawSchema, format)

      default:
        this.$message.error(`Deserialization: Schema type is not defined or is not supported.`)
        return payload
    }
  }

  private extractPrimaryValue(
    dataPoint: TimeSeriesDataPoint,
    widget: WidgetModel,
  ): { value: number; fieldName: string } {
    if (widget.valueField && widget.valueField.trim() !== '' && dataPoint.values[widget.valueField] !== undefined) {
      const value = dataPoint.values[widget.valueField]
      return {
        value: typeof value === 'number' ? value : widget.fallbackValue,
        fieldName: widget.valueField,
      }
    }

    const entries = Object.entries(dataPoint.values)
    const numericEntry = entries.find(([key, value]) => typeof value === 'number')

    if (numericEntry) {
      return {
        value: numericEntry[1] as number,
        fieldName: numericEntry[0],
      }
    }

    return {
      value: widget.fallbackValue,
      fieldName: 'value',
    }
  }

  private createInitialWidgetData(widgetType: WidgetType): BigNumberData | GaugeData | LineData {
    switch (widgetType) {
      case 'Big Number':
        return {
          value: null,
          chartData: {
            xData: [],
            seriesData: [
              {
                name: 'value',
                data: [],
              },
            ],
          },
        }
      case 'Gauge':
        return {
          value: null,
        }
      case 'Line':
        return {
          chartData: {
            xData: [],
            seriesData: [
              {
                name: 'value',
                data: [],
              },
            ],
          },
        }
      default:
        throw new Error(`Unknown widget type: ${widgetType}`)
    }
  }

  private async updateWidgetSchemaValidationState(
    widget: WidgetModel,
    state: 'valid' | 'invalid',
    error?: string | null,
  ): Promise<void> {
    if (!widget.id) return
    try {
      const { widgetService } = useServices()
      const updatedWidget = await widgetService.get(widget.id)
      if (updatedWidget) {
        updatedWidget.schemaValidationState = state
        updatedWidget.schemaValidationError = error || undefined
        await widgetService.update(widget.id, updatedWidget)

        this.updateLocalWidgetState(widget.id, {
          schemaValidationState: state,
          schemaValidationError: error || undefined,
        })
      }
    } catch (error) {
      this.handleError(error as Error, 'Update widget schema validation state')
    }
  }

  private updateLocalWidgetState(widgetId: string, updates: Partial<WidgetModel>): void {
    const localWidget = this.widgets.find((w) => w.id === widgetId)
    if (localWidget) {
      Object.assign(localWidget, updates)
      this.$forceUpdate()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/scss/variable.scss';
@import '@/assets/scss/mixins.scss';

.dashboard-canvas-root {
  width: 100%;
  min-height: 100%;
  background: var(--color-bg-primary);
  padding: 0;
}

.dashboard-canvas-grid {
  width: 100%;
  margin-top: 10px;
  height: 100%;
  min-height: 400px;

  .vue-grid-layout {
    background: var(--color-bg-primary);
    border-radius: 8px;
    min-height: 400px;
    transition: background 0.2s;
  }

  .vue-grid-item:not(.vue-grid-placeholder) {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    box-shadow: 0 1px 4px 0 var(--color-shadow-leftlist);
    transition: background 0.2s, border 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    overflow: hidden;
    padding: 0;

    &:hover {
      border-color: var(--color-main-green);
      background: var(--color-bg-hover);
    }

    .vue-resizable-handle {
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .vue-resizable-handle {
      opacity: 1;
    }
  }

  .dashboard-canvas-grid-text {
    font-size: 24px;
    color: var(--color-text-title);
    text-align: center;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  ::v-deep .vue-grid-item.vue-grid-placeholder {
    background: var(--color-main-green) !important;
  }
}

.widget-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
}

.widget-title-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.widget-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.widget-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--color-minor-red);
  margin-top: 2px;
  cursor: help;

  .el-icon-warning {
    font-size: 12px;
  }

  .el-icon-warning-outline {
    font-size: 12px;
    color: var(--color-text-light);
  }

  .warning-text {
    font-weight: 500;
  }
}

.widget-menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--color-text-tips);
  cursor: pointer;
}

.widget-body {
  flex: 1;
  min-height: 0;
  padding: 8px;
}
</style>

<style lang="scss">
.dashboard-widget-dropdown {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-default);
  box-shadow: 0 4px 12px 0 var(--color-shadow-leftlist);
  padding: 0;
  border-radius: 8px;

  .el-dropdown-menu {
    background: var(--color-bg-card);
    border: none;
    padding: 8px 0;
  }

  .el-dropdown-menu__item {
    color: var(--color-text-title);
    line-height: 32px;
    height: 32px;
    padding: 4px 12px;
    display: flex;
    align-items: center;

    .iconfont {
      font-size: 18px;
      margin-right: 5px;
    }

    &.is-disabled {
      cursor: not-allowed;
      color: var(--color-text-light);
      &:hover {
        color: var(--color-text-light);
      }
    }

    &.is-danger {
      color: var(--color-minor-red);
    }

    &:hover,
    &:focus {
      color: var(--color-main-green);
      background: var(--color-light-green);
    }

    &.is-danger:hover,
    &.is-danger:focus {
      color: var(--color-minor-red);
      background: var(--color-light-red);
    }

    &.is-warning {
      color: var(--color-warning);
    }

    &.is-warning:hover,
    &.is-warning:focus {
      color: var(--color-warning);
      background: var(--color-light-warning);
    }

    &.is-success {
      color: var(--color-main-green);
    }

    &.is-success:hover,
    &.is-success:focus {
      color: var(--color-main-green);
      background: var(--color-light-green);
    }
  }

  .el-dropdown-menu__item--divided {
    position: relative;
    &::before {
      content: '';
      display: block;
      position: absolute;
      left: 0;
      right: 0;
      top: -4px;
      height: 1px;
      background: var(--color-border-default);
    }
  }
}

:global(.el-tooltip__popper) {
  max-width: 300px;
  white-space: pre-line;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
}
</style>

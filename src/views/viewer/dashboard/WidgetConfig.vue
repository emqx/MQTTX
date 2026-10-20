<template>
  <div class="widget-config card-form" :class="{ 'is-wide': isWide }">
    <div class="topbar">
      <div class="topbar-left">
        <a href="javascript:;" @click="$emit('cancel')"> <i class="el-icon-arrow-left"></i>{{ $t('common.back') }} </a>
      </div>
      <div class="topbar-center">
        <h2>{{ $t('viewer.addVisualization') }}</h2>
      </div>
      <div class="topbar-right">
        <a href="javascript:;" @click="handleSave" class="connect-btn">{{ $t('common.save') }}</a>
      </div>
    </div>

    <div ref="body" class="widget-config-body">
      <div class="widget-config-content">
        <!-- Preview: left column when wide, first block when narrow -->
        <div class="preview-column">
          <section class="config-section">
            <div class="config-section-head">
              <h3 class="config-section-title">{{ $t('viewer.preview') }}</h3>
              <el-tooltip :content="$t('viewer.refreshPreview')" placement="top">
                <a href="javascript:;" class="icon-oper" @click="refreshPreview">
                  <i class="el-icon-refresh-right"></i>
                </a>
              </el-tooltip>
            </div>
            <div class="preview-card">
              <div class="preview-card-header">
                <span class="preview-card-title">{{ previewTitle }}</span>
              </div>
              <div class="preview-body">
                <div v-if="!formModel.type" class="preview-placeholder">{{ $t('common.noData') }}</div>
                <div v-else class="preview-widget">
                  <WidgetRenderer
                    :key="`preview-${previewRefreshKey}`"
                    :widget="previewWidget"
                    :data="previewData"
                    style="width: 100%; height: 100%"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <el-form ref="form" class="widget-form" label-position="top" :model="formModel" :rules="rules">
          <!-- General Settings -->
          <section class="config-section">
            <div class="config-section-head">
              <h3 class="config-section-title">{{ $t('viewer.general') }}</h3>
            </div>
            <el-card shadow="never" class="item-card">
              <el-form-item :label="$t('viewer.type')" prop="type">
                <el-select size="small" v-model="formModel.type">
                  <el-option
                    v-for="type in availableTypes"
                    :key="type"
                    :label="type.charAt(0).toUpperCase() + type.slice(1)"
                    :value="type"
                  />
                </el-select>
              </el-form-item>
              <el-form-item :label="$t('viewer.title')" prop="title">
                <el-input size="small" v-model="formModel.title" />
              </el-form-item>
            </el-card>
          </section>

          <!-- Type-Specific Options -->
          <section v-if="formModel.type" class="config-section">
            <div class="config-section-head">
              <h3 class="config-section-title">{{ formModel.type }} {{ $t('viewer.options') }}</h3>
            </div>
            <component :is="optionsComponent" :options.sync="formModel.widgetOptions" />
          </section>

          <!-- Threshold Configuration -->
          <section class="config-section">
            <div class="config-section-head">
              <h3 class="config-section-title">{{ $t('viewer.thresholds') }}</h3>
            </div>
            <el-card shadow="never" class="item-card">
              <ThresholdEditor v-model="thresholds" :thresholds-type.sync="thresholdsType" />
            </el-card>
          </section>

          <!-- Data Source -->
          <section class="config-section">
            <div class="config-section-head">
              <h3 class="config-section-title">{{ $t('viewer.dataSource') }}</h3>
            </div>
            <el-card shadow="never" class="item-card">
              <el-form-item :label="$t('viewer.connection')" prop="connectionId">
                <ConnectionSelect v-model="formModel.connectionId" width="100%" size="small" />
              </el-form-item>
              <el-form-item :label="$t('viewer.topicPattern')" prop="topicPattern">
                <TopicSelect
                  v-model="formModel.topicPattern"
                  :connection-id="formModel.connectionId || ''"
                  width="100%"
                  size="small"
                />
              </el-form-item>
              <el-form-item :label="$t('viewer.valueField')" title="JSON path or field name for data extraction">
                <el-input size="small" v-model="formModel.valueField" placeholder="$.temp or temp" />
              </el-form-item>
            </el-card>
          </section>

          <!-- Schema -->
          <section class="config-section">
            <div class="config-section-head">
              <h3 class="config-section-title">{{ $t('script.schemaTab') }}</h3>
            </div>
            <el-card shadow="never" class="item-card">
              <!-- Schema Validation Warning -->
              <div v-if="formModel.schemaValidationState === 'invalid'" class="schema-warning">
                <el-alert
                  :title="formModel.schemaValidationError || 'Schema validation is failing'"
                  type="warning"
                  :closable="false"
                  show-icon
                />
              </div>

              <el-form-item :label="$t('script.schemaType')">
                <el-select size="small" v-model="formModel.schemaType">
                  <el-option label="None" :value="undefined" />
                  <el-option label="Protobuf" value="protobuf" />
                  <el-option label="Avro" value="avro" />
                </el-select>
              </el-form-item>
              <el-form-item :label="$t('script.schemaName')" title="Select stored schema">
                <el-select
                  size="small"
                  v-model="formModel.schemaId"
                  @change="handleSchemaChange"
                  :disabled="!formModel.schemaType"
                >
                  <el-option
                    v-for="schema in availableSchemas"
                    :key="schema.id"
                    :value="schema.id"
                    :label="schema.name"
                  />
                </el-select>
              </el-form-item>
              <el-form-item
                v-if="formModel.schemaType === 'protobuf'"
                :label="$t('viewer.messageName')"
                title="Protobuf message name"
              >
                <el-input size="small" v-model="formModel.schemaMessageName" placeholder="MyMessage" />
              </el-form-item>
              <el-form-item>
                <template #label>
                  <span class="label-with-hint">
                    {{ $t('viewer.fallbackValue') }}
                    <el-tooltip :content="$t('viewer.fallbackValueTip')" placement="top">
                      <i class="el-icon-warning-outline icon-oper"></i>
                    </el-tooltip>
                  </span>
                </template>
                <el-input type="number" size="small" v-model.number="formModel.fallbackValue" placeholder="0" />
              </el-form-item>
            </el-card>
          </section>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import BigNumberConfig from '@/components/widget-configs/BigNumberConfig.vue'
import GaugeConfig from '@/components/widget-configs/GaugeConfig.vue'
import LineConfig from '@/components/widget-configs/LineConfig.vue'
import ConnectionSelect from '@/components/ConnectionSelect.vue'
import TopicSelect from '@/components/TopicSelect.vue'
import ThresholdEditor from '@/components/ThresholdEditor.vue'
import { widgetRegistry } from '@/widgets/widgetRegistry'
import WidgetRenderer from '@/widgets/WidgetRenderer.vue'
import useServices from '@/database/useServices'

// Schema file extension per schema type (used to filter the schema picker).
const SCHEMA_EXTENSIONS: Record<string, string> = { protobuf: 'proto', avro: 'avsc' }

@Component({
  components: {
    ConnectionSelect,
    TopicSelect,
    WidgetRenderer,
    BigNumberConfig,
    GaugeConfig,
    LineConfig,
    ThresholdEditor,
  },
})
export default class WidgetConfig extends Vue {
  @Prop({ type: Object, default: null }) readonly initialWidget!: Partial<WidgetModel> | null

  // Schema management (following UseScript pattern)
  private availableSchemas: ScriptModel[] = []

  private formModel: Partial<WidgetModel> = this.getBaseFormModel()

  // Threshold configuration (shared across all types)
  private thresholds: any[] = []
  private thresholdsType: 'Absolute' | 'Percentage' = 'Absolute'

  // Preview refresh key to force re-rendering
  private previewRefreshKey = 0

  // Flag to track initialization to prevent clearing schema values during setup
  private isInitializing = true

  get availableTypes() {
    return widgetRegistry.getAvailableTypes()
  }

  // === INITIALIZATION METHODS ===
  private getBaseFormModel(): Partial<WidgetModel> {
    return {
      type: 'Big Number' as WidgetType,
      title: '',
      x: 0,
      y: 0,
      w: 4,
      h: 6,
      static: false,
      connectionId: '',
      topicPattern: '',
      valueField: '',
      fallbackValue: 0,
      schemaType: undefined,
      schemaId: '',
      schemaMessageName: '',
      widgetOptions: {},
    }
  }

  private resetFormModel() {
    this.formModel = this.getBaseFormModel()
    this.thresholds = []
    this.thresholdsType = 'Absolute'
  }

  private initializeFormModel(widget?: Partial<WidgetModel>) {
    this.resetFormModel()

    if (widget) {
      this.applyWidgetData(widget)
    } else {
      this.applyDefaults()
    }

    this.initializeDerivedState()
  }

  private applyWidgetData(widget: Partial<WidgetModel>) {
    this.formModel = {
      ...this.getBaseFormModel(),
      ...widget,
      widgetOptions: widget.widgetOptions ? { ...widget.widgetOptions } : undefined,
    }
  }

  private applyDefaults() {
    const defaultType = 'Big Number' as WidgetType
    this.formModel = {
      ...this.getBaseFormModel(),
      type: defaultType,
      widgetOptions: { ...widgetRegistry.getDefaultOptions(defaultType) },
    }
  }

  private initializeDerivedState() {
    // Initialize thresholds from widget options
    if (this.formModel.widgetOptions) {
      this.thresholds = [...(this.formModel.widgetOptions.thresholds || [])]
      this.thresholdsType = this.formModel.widgetOptions.thresholdsType || 'Absolute'
    }
  }

  // === THRESHOLD MANAGEMENT ===
  private updateThresholds(thresholds: any[], type: 'Absolute' | 'Percentage') {
    if (!this.formModel.widgetOptions) {
      this.formModel.widgetOptions = {}
    }
    this.formModel.widgetOptions.thresholds = [...thresholds]
    this.formModel.widgetOptions.thresholdsType = type
  }

  @Watch('formModel.type')
  onTypeChange(newType: WidgetType, oldType: WidgetType) {
    if (!newType || this.isInitializing) return

    // Only apply defaults if switching to a type without existing options
    if (!this.formModel.widgetOptions || oldType !== newType) {
      const defaults = widgetRegistry.getDefaultOptions(newType)
      this.formModel.widgetOptions = {
        ...defaults,
        // Preserve thresholds across type changes
        thresholds: this.formModel.widgetOptions?.thresholds || [],
        thresholdsType: this.formModel.widgetOptions?.thresholdsType || 'Absolute',
      }
    }
  }

  get previewWidget(): WidgetModel | null {
    if (!this.formModel.type) return null
    const defaults = widgetRegistry.getDefaultOptions(this.formModel.type)

    const previewOptions = {
      ...defaults,
      ...this.formModel.widgetOptions,
      color: this.formModel.widgetOptions?.color || '#00B572',
    }

    return {
      id: 'preview-widget',
      dashboardId: 'preview',
      type: this.formModel.type,
      title: this.formModel.title || 'Sample Widget',
      schemaType: this.formModel.schemaType,
      schemaId: this.formModel.schemaId || '',
      schemaMessageName: this.formModel.schemaMessageName || '',
      fallbackValue: this.formModel.fallbackValue || 0,
      widgetOptions: previewOptions,
      x: this.formModel.x ?? 0,
      y: this.formModel.y ?? 0,
      w: this.formModel.w ?? 4,
      h: this.formModel.h ?? 4,
      static: this.formModel.static ?? false,
      connectionId: this.formModel.connectionId || '',
      topicPattern: this.formModel.topicPattern || '',
      valueField: this.formModel.valueField || '',
    } as WidgetModel
  }

  /**
   * Title shown in the preview card header: the widget title when set, else the
   * type name, matching how the dashboard card header reads.
   */
  get previewTitle(): string {
    return this.formModel.title || this.formModel.type || ''
  }

  async created() {
    await this.initializeComponent()
  }

  mounted() {
    this.setupWidthObserver()
  }

  beforeDestroy() {
    this.widthObserver?.disconnect()
    this.widthObserver = null
  }

  // === LAYOUT WIDTH ===
  private isWide = false
  private widthObserver: ResizeObserver | null = null

  /**
   * Two columns from 880px of body width (see `.is-wide`). The project's sass is
   * 1.32, so container queries are not available and a ResizeObserver is used.
   */
  private setupWidthObserver(): void {
    const body = this.$refs.body as HTMLElement | undefined
    if (!body) return

    // Two columns once the body can fit the preview next to the form
    const update = (width: number) => (this.isWide = width >= 880)
    this.widthObserver = new ResizeObserver(([entry]) => update(entry.contentRect.width))
    this.widthObserver.observe(body)
    update(body.clientWidth)
  }

  private async initializeComponent() {
    this.isInitializing = true

    try {
      // 1. Initialize form model (also seeds the derived threshold state)
      this.initializeFormModel(this.initialWidget || undefined)

      // 2. Load external data
      await this.loadSchemas()
    } finally {
      this.isInitializing = false
    }
  }

  @Watch('initialWidget', { immediate: false })
  async onInitialWidgetChanged() {
    await this.initializeComponent()
  }

  @Watch('formModel.schemaType')
  async onSchemaTypeChange(newType: string, oldType: string) {
    await this.loadSchemas()

    // Only clear if user actively changed schema type (not during initialization)
    if (!this.isInitializing && newType !== oldType) {
      this.formModel.schemaId = ''
      this.formModel.schemaMessageName = ''
    }
  }

  @Watch('thresholds', { deep: true })
  onThresholdsChange() {
    this.updateThresholds(this.thresholds, this.thresholdsType)
  }

  @Watch('thresholdsType')
  onThresholdsTypeChange() {
    this.updateThresholds(this.thresholds, this.thresholdsType)
  }

  // === SCHEMA METHODS ===
  private async loadSchemas() {
    const { scriptService } = useServices()
    const schemas: ScriptModel[] = (await scriptService.getAllSchema()) ?? []

    const extension = this.formModel.schemaType ? SCHEMA_EXTENSIONS[this.formModel.schemaType] : undefined
    if (!extension) {
      this.availableSchemas = []
      return
    }

    this.availableSchemas = schemas.filter((s) => s.name.endsWith(extension))
  }

  private handleSchemaChange() {
    this.formModel.schemaMessageName = ''
  }

  // === PREVIEW METHODS ===
  private refreshPreview() {
    this.previewRefreshKey++
  }

  // === VALIDATION METHODS ===
  get rules() {
    return {
      type: [{ required: true, message: this.$t('common.inputRequired') }],
      connectionId: [
        {
          required: true,
          message: this.$t('common.inputRequired'),
          validator: (rule: any, value: any, callback: any) => {
            if (!this.formModel.connectionId) {
              callback(new Error(String(this.$t('common.inputRequired'))))
            } else {
              callback()
            }
          },
        },
      ],
      topicPattern: [
        {
          required: true,
          message: this.$t('common.inputRequired'),
          validator: (rule: any, value: any, callback: any) => {
            if (!this.formModel.topicPattern) {
              callback(new Error(String(this.$t('common.inputRequired'))))
            } else {
              callback()
            }
          },
        },
      ],
    }
  }

  get defaultTitle(): string {
    return this.formModel.title || 'New Widget'
  }

  get previewValue() {
    if (!this.formModel.type) return null
    const seed = this.previewRefreshKey * 1000 + this.formModel.type.length
    switch (this.formModel.type) {
      case 'Big Number':
        return Math.round((75 + Math.sin(seed) * 10) * 10) / 10
      case 'Gauge':
        return Math.round((68 + Math.cos(seed) * 15) * 10) / 10
      default:
        return null
    }
  }

  get previewChartData() {
    if (!this.formModel.type) return null
    const seed = this.previewRefreshKey * 1000 + this.formModel.type.length

    const now = new Date()
    const xData: string[] = []
    const seriesData: number[] = []

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      xData.push(date.toISOString().split('T')[0])

      let value: number
      const randomSeed = (seed + i) * 0.1
      switch (this.formModel.type) {
        case 'Big Number':
          value = 20 + Math.sin(randomSeed) * 5 + Math.sin(i * 0.2 + seed) * 3
          break
        case 'Line':
          // Create more dramatic variations to make smooth/rough difference visible
          const baseValue = 50
          const wave1 = Math.sin(i * 0.4 + seed) * 25 // Primary wave
          const wave2 = Math.sin(i * 0.8 + seed * 0.5) * 15 // Secondary wave
          const wave3 = Math.sin(i * 1.5 + seed * 0.3) * 8 // High frequency wave
          const noise = (Math.random() - 0.5) * 10 // Random noise

          // Add some sharp transitions to make the difference more visible
          const sharpTransition = i % 8 === 0 ? (Math.random() - 0.5) * 30 : 0

          value = baseValue + wave1 + wave2 + wave3 + noise + sharpTransition
          break
        default:
          value = 50 + Math.sin(randomSeed) * 30
      }
      seriesData.push(Math.round(value * 100) / 100)
    }

    return {
      xData,
      seriesData: [
        {
          name: 'value',
          data: seriesData,
        },
      ],
    }
  }

  get previewData() {
    if (!this.formModel.type) return null

    const chartData = this.previewChartData
    const value = this.previewValue

    switch (this.formModel.type) {
      case 'Big Number':
        return {
          value,
          fieldName: this.formModel.valueField || 'temperature',
          chartData: chartData || { xData: [], seriesData: [{ name: 'value', data: [] }] },
        } as BigNumberData
      case 'Gauge':
        return {
          value,
        } as GaugeData
      case 'Line':
        return {
          chartData: chartData || { xData: [], seriesData: [{ name: 'value', data: [] }] },
        } as LineData
      default:
        return null
    }
  }

  private get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  // === SAVE METHODS ===
  private handleSave() {
    this.vueForm.validate((valid: boolean) => {
      if (!valid) {
        this.$message.warning(String(this.$t('viewer.inputValidationFailed')))
        return
      }

      try {
        if (!this.formModel.type) {
          throw new Error(String(this.$t('viewer.widgetTypeRequired')))
        }

        if (!this.formModel.connectionId) {
          throw new Error(String(this.$t('viewer.connectionRequired')))
        }

        if (!this.formModel.topicPattern) {
          throw new Error(String(this.$t('viewer.topicPatternRequired')))
        }

        this.formModel.schemaValidationState = undefined
        this.formModel.schemaValidationError = undefined

        const payload: Partial<WidgetModel> = {
          ...this.formModel,
          title: this.defaultTitle,
        }

        this.$emit('save', payload)
      } catch (error) {
        this.$log?.error?.(`[WIDGET_CONFIG] Save error: ${(error as Error).toString()}`)
        this.$message.error(`Configuration error: ${(error as Error).message}`)
      }
    })
  }

  private get optionsComponent() {
    switch (this.formModel.type) {
      case 'Big Number':
        return BigNumberConfig
      case 'Gauge':
        return GaugeConfig
      case 'Line':
        return LineConfig
      default:
        return null
    }
  }
}
</script>

<style lang="scss" scoped>
.widget-config {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 16px;

  .topbar {
    -webkit-app-region: drag;
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    height: 48px;
    // Home.vue's (non-scoped) `.home-view .topbar` sets min-height: 60px.
    min-height: 48px;
    background-color: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border-default);
    // Full-bleed divider, content aligned with the 16px content insets.
    margin: 0 -16px;
    padding: 0 16px;

    a {
      -webkit-app-region: no-drag;
    }

    .topbar-center h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-title);
    }

    .connect-btn {
      font-size: 13px;
      font-weight: 500;
    }
  }

  .widget-config-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 0 40px;
  }

  .widget-config-content {
    max-width: 1200px;
  }

  // Narrow (default): one column, preview first, not sticky.
  .preview-column {
    margin-bottom: 20px;

    .config-section {
      margin-bottom: 0;
    }
  }

  // Wide: preview on the left and sticky, all form groups on the right.
  &.is-wide .widget-config-content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(360px, 440px);
    column-gap: 16px;
    align-items: start;
  }

  &.is-wide .preview-column {
    position: sticky;
    top: 0;
    margin-bottom: 0;
  }

  .config-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .config-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 20px;
    margin-bottom: 8px;

    .config-section-title {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-title);
    }
  }

  // Card styling shared by every group. `> .el-card__body` adds a step so this
  // beats `.card-form .item-card .el-card__body` (padding 10px 20px) in base.scss.
  .item-card {
    margin: 0;
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    background: var(--color-bg-normal);
    box-shadow: none;

    ::v-deep > .el-card__body {
      padding: 16px;
    }
  }

  // The colour swatch row should be as tall as the other controls.
  ::v-deep .color-picker-item .el-form-item__content {
    height: 32px !important;
  }

  .icon-oper {
    color: var(--color-text-light);
    transition: 0.2s color ease;

    &:hover {
      color: var(--color-main-green);
    }

    .el-icon-refresh-right {
      font-size: 15px;
    }
  }

  // Preview card mirrors a dashboard widget card.
  .preview-card {
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    background: var(--color-bg-normal);
    overflow: hidden;

    .preview-card-header {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 0 16px;
    }

    .preview-card-title {
      min-width: 0;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-title);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preview-body {
      width: 100%;
      height: 260px;
      display: flex;
      align-items: center;
      justify-content: center;
      // No padding so the Big Number sparkline can reach the card edges.
      padding: 0;

      .preview-placeholder {
        color: var(--color-text-light);
        font-size: 13px;
      }

      .preview-widget {
        width: 100%;
        height: 100%;
      }
    }
  }

  // Labels above the controls, full-width controls.
  // Prefixed with `.widget-config-content` so these outrank the `.card-form
  // .el-form .el-form-item*` rules in base.scss (label height/line-height 43px,
  // item margin 0) instead of relying on style injection order.
  ::v-deep .widget-config-content .widget-form {
    min-width: 0;

    .el-form-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    // Paired fields sit in their own columns, where each item is a last child
    .el-row:not(:last-child) .el-form-item {
      margin-bottom: 16px;
    }

    .el-form-item .el-form-item__label {
      display: block;
      float: none;
      width: auto;
      height: auto;
      padding: 0 0 6px;
      margin: 0;
      line-height: 1.4;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-default);
    }

    .el-form-item .el-form-item__content {
      width: 100%;
      margin-left: 0;
      line-height: normal;
    }

    .el-input,
    .el-select,
    .el-autocomplete {
      width: 100%;
    }
  }

  // Form items rendered by the type-specific config components.
  ::v-deep .widget-config-section .item-card {
    margin: 0;
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    background: var(--color-bg-normal);
    box-shadow: none;

    > .el-card__body {
      padding: 16px;
    }
  }

  .el-color-picker__trigger {
    border-color: var(--color-border-default) !important;
    background-color: var(--color-bg-normal) !important;
  }

  .el-select .el-input .el-select__caret {
    color: var(--color-text-default);
  }

  // Hint icon next to a form label (same pattern as the settings page).
  .label-with-hint {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    .icon-oper {
      font-size: 13px;
    }
  }

  .schema-warning {
    margin-bottom: 16px;
  }
}

.el-input input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
.el-input input[type='number']::-webkit-inner-spin-button,
.el-input input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.btn-props-plus,
.btn-delete {
  color: var(--color-main-green);
  &:hover {
    color: var(--color-minor-green);
  }
}

::v-deep .el-form-item__error {
  display: none;
}
</style>

<style lang="scss">
body.dark,
body.night {
  .el-select-dropdown {
    background-color: var(--color-bg-messagebox) !important;
    border-color: var(--color-border-default) !important;

    .el-select-dropdown__item {
      color: var(--color-text-default) !important;

      &:hover {
        background-color: var(--color-bg-item) !important;
      }

      &.selected {
        color: var(--color-main-green) !important;
        background-color: var(--color-bg-item) !important;
      }
    }
  }

  .el-color-dropdown {
    background-color: var(--color-bg-messagebox) !important;
    border-color: var(--color-border-default) !important;

    .el-color-dropdown__value,
    .el-color-picker__btns {
      background-color: var(--color-bg-normal) !important;

      .el-button {
        background-color: var(--color-bg-normal) !important;
        border-color: var(--color-border-default) !important;
        color: var(--color-text-default) !important;

        &:hover {
          background-color: var(--color-bg-item) !important;
          border-color: var(--color-main-green) !important;
          color: var(--color-main-green) !important;
        }
      }
    }
  }
}
</style>

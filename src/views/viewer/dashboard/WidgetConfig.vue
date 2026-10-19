<template>
  <div class="widget-config card-form">
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

    <div class="widget-config-body">
      <el-form
        ref="form"
        class="widget-form"
        label-position="right"
        label-width="140px"
        :model="formModel"
        :rules="rules"
      >
        <!-- General Settings -->
        <section class="config-section">
          <div class="config-section-head">
            <h3 class="config-section-title">{{ $t('viewer.general') }}</h3>
          </div>
          <el-card shadow="never" class="item-card">
            <el-form-item :label="$t('viewer.type')" prop="type">
              <el-select size="mini" v-model="formModel.type">
                <el-option
                  v-for="type in availableTypes"
                  :key="type"
                  :label="type.charAt(0).toUpperCase() + type.slice(1)"
                  :value="type"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('viewer.title')" prop="title">
              <el-input size="mini" v-model="formModel.title" />
            </el-form-item>
          </el-card>
        </section>

        <!-- Preview -->
        <section class="config-section">
          <div class="config-section-head">
            <h3 class="config-section-title">{{ $t('viewer.preview') }}</h3>
            <el-tooltip :content="$t('viewer.refreshPreview')" placement="top">
              <a href="javascript:;" class="icon-oper" @click="refreshPreview">
                <i class="el-icon-refresh-right"></i>
              </a>
            </el-tooltip>
          </div>
          <el-card shadow="never" class="item-card">
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
          <el-card shadow="never" class="item-card">
            <ThresholdEditor
              v-model="thresholds"
              :thresholds-type.sync="thresholdsType"
              :title="$t('viewer.thresholds')"
            />
          </el-card>
        </section>

        <!-- Data Source -->
        <section class="config-section">
          <div class="config-section-head">
            <h3 class="config-section-title">{{ $t('viewer.dataSource') }}</h3>
          </div>
          <el-card shadow="never" class="item-card">
            <el-form-item :label="$t('viewer.connection')" prop="connectionId">
              <ConnectionSelect v-model="formModel.connectionId" width="100%" size="mini" />
            </el-form-item>
            <el-form-item :label="$t('viewer.topicPattern')" prop="topicPattern">
              <TopicSelect
                v-model="formModel.topicPattern"
                :connection-id="formModel.connectionId || ''"
                width="100%"
                size="mini"
              />
            </el-form-item>
            <el-form-item :label="$t('viewer.valueField')" title="JSON path or field name for data extraction">
              <el-input size="mini" v-model="formModel.valueField" placeholder="$.temp or temp" />
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
              <el-select size="mini" v-model="formModel.schemaType">
                <el-option label="None" :value="undefined" />
                <el-option label="Protobuf" value="protobuf" />
                <el-option label="Avro" value="avro" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('script.schemaName')" title="Select stored schema">
              <el-select
                size="mini"
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
              <el-input size="mini" v-model="formModel.schemaMessageName" placeholder="MyMessage" />
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
              <el-input type="number" size="mini" v-model.number="formModel.fallbackValue" placeholder="0" />
            </el-form-item>
          </el-card>
        </section>
      </el-form>
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
  private defaultSchemaTypes = {
    protobuf: {
      extension: 'proto',
    },
    avro: {
      extension: 'avsc',
    },
  }

  private formModel: Partial<WidgetModel> = {
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
  private get effectiveThresholds() {
    return this.formModel.widgetOptions?.thresholds || []
  }

  private get effectiveThresholdsType() {
    return this.formModel.widgetOptions?.thresholdsType || 'Absolute'
  }

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

    const defaults = widgetRegistry.getDefaultOptions(this.formModel.type || 'Big Number')

    const previewOptions = {
      ...defaults,
      ...this.formModel.widgetOptions,
      color: this.formModel.widgetOptions?.color || '#00B572',
    }

    return {
      id: 'preview-widget',
      dashboardId: 'preview',
      type: this.formModel.type || '',
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

  async created() {
    await this.initializeComponent()
  }

  private async initializeComponent() {
    this.isInitializing = true

    try {
      // 1. Initialize form model
      this.initializeFormModel(this.initialWidget || undefined)

      // 2. Load external data
      await this.loadSchemas()

      // 3. Setup derived state
      this.initializeDerivedState()
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

    if (!this.formModel.schemaType || !this.defaultSchemaTypes[this.formModel.schemaType]) {
      this.availableSchemas = []
      return
    }

    const extension = this.defaultSchemaTypes[this.formModel.schemaType].extension
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

  get isDataSourceConfigured(): boolean {
    return !!this.formModel.connectionId && !!this.formModel.topicPattern
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
          title: this.formModel.title || '' || this.defaultTitle,
        }

        this.$emit('save', payload)
      } catch (error) {
        console.error('[WIDGET_CONFIG] Save error:', error)
        this.$message.error(`Configuration error: ${(error as Error).message}`)
      }
    })
  }

  private get optionsComponent() {
    if (!this.formModel.type) {
      return null
    }
    let component = null
    switch (this.formModel.type) {
      case 'Big Number':
        component = BigNumberConfig
        break
      case 'Gauge':
        component = GaugeConfig
        break
      case 'Line':
        component = LineConfig
        break
      default:
        component = null
    }
    return component
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
    background-color: var(--color-bg-primary);
    // Align the header actions with the form body below (the form already
    // carries the horizontal padding).
    padding: 0;

    a {
      -webkit-app-region: no-drag;
    }

    .connect-btn {
      font-size: 13px;
      font-weight: 500;
    }
  }
  .widget-config-body {
    padding: 16px 0 40px;
  }

  .config-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .config-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 26px;
    margin-bottom: 8px;

    .config-section-title {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-title);
    }
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

  .preview-body {
    width: 100%;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;

    .preview-placeholder {
      color: var(--color-text-light);
      font-size: 13px;
    }

    .preview-widget {
      width: 100%;
      height: 100%;
    }
  }

  ::v-deep .widget-form {
    max-width: 560px;

    .el-form-item {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .el-form-item__content {
      max-width: 320px;
      line-height: 28px;
    }

    .el-form-item__label {
      color: var(--color-text-default);
      line-height: 28px;
      height: 28px;
    }
  }

  .el-button--mini {
    background-color: var(--color-bg-normal);
    border-color: var(--color-border-default);
    color: var(--color-text-default);

    &:hover,
    &:focus {
      background-color: var(--color-bg-item);
      border-color: var(--color-main-green);
      color: var(--color-main-green);
    }

    &:active {
      background-color: var(--color-bg-item);
      border-color: var(--color-main-green);
      color: var(--color-main-green);
    }
  }

  .el-input-number {
    .el-input-number__decrease,
    .el-input-number__increase {
      background-color: var(--color-bg-normal) !important;
      border-color: var(--color-border-default) !important;
      color: var(--color-text-default) !important;

      &:hover {
        background-color: var(--color-bg-item) !important;
        color: var(--color-main-green) !important;
      }
    }

    .el-input__inner {
      background-color: var(--color-bg-normal);
      border-color: var(--color-border-default);
      color: var(--color-text-default);
    }
  }

  .el-color-picker__trigger {
    border-color: var(--color-border-default) !important;
    background-color: var(--color-bg-normal) !important;
  }

  .el-select .el-input .el-select__caret {
    color: var(--color-text-default);
  }

  .el-form-item__label {
    color: var(--color-text-default) !important;
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

  ::v-deep .el-button.color-button.el-button--mini {
    height: 28px;
    line-height: 26px;
    padding: 0 8px;
  }

  .threshold-header {
    font-weight: 600;
    margin-top: 10px;
    color: var(--color-text-title);
  }

  // ThresholdEditor (root `.key-value-editor`) styles its own title, so ::v-deep is needed to reach it.
  // Match the other form labels instead of the editor's heavier 600 weight.
  ::v-deep .key-value-editor .editor-header .editor-title {
    color: var(--color-text-default);
    font-weight: 400;
  }

  .threshold-editor {
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .editor-title {
        color: var(--color-text-default);
      }
    }
    .editor-row {
      .editor-row {
        display: flex;
        align-items: center;
        &:not(:last-child) {
          margin-bottom: 10px;
        }
      }
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

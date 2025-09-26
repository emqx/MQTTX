<template>
  <div class="widget-config card-form">
    <div class="topbar">
      <div class="topbar-left">
        <a href="javascript:;" @click="$emit('cancel')"> <i class="el-icon-arrow-left"></i>Back </a>
      </div>
      <div class="topbar-center">
        <h2>Add Visualization</h2>
      </div>
      <div class="topbar-right">
        <a href="javascript:;" @click="handleSave" class="connect-btn">Save</a>
      </div>
    </div>

    <el-form ref="form" label-position="right" label-width="160px" :model="formModel" :rules="rules">
      <!-- General Settings -->
      <div class="widget-section-header"><h3>General</h3></div>
      <el-card shadow="never" class="widget-section-body item-card">
        <el-row :gutter="10">
          <el-col :span="22">
            <el-form-item label-width="93px" label="Type" prop="type">
              <el-select size="mini" v-model="formModel.type">
                <el-option
                  v-for="type in availableTypes"
                  :key="type"
                  :label="type.charAt(0).toUpperCase() + type.slice(1)"
                  :value="type"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="2"></el-col>
          <el-col :span="22">
            <el-form-item label-width="93px" label="Title" prop="title">
              <el-input size="mini" v-model="formModel.title" />
            </el-form-item>
          </el-col>
          <el-col :span="2"></el-col>
        </el-row>
      </el-card>

      <!-- Preview -->
      <el-card shadow="never" class="preview-card">
        <div class="preview-header">
          <h3>Preview</h3>
          <a href="javascript:;" class="icon-oper" title="Refresh">
            <i class="el-icon-refresh-right"></i>
          </a>
        </div>
        <div class="preview-body">
          <div v-if="!formModel.type" class="preview-placeholder">{{ $t('common.noData') || 'No Data' }}</div>
          <div v-else class="preview-widget">
            <WidgetRenderer
              :widget="previewWidget"
              :value="previewValue"
              :chart-data="previewChartData"
              style="width: 100%; height: 100%"
            />
          </div>
        </div>
      </el-card>

      <!-- Type-Specific Options -->
      <div v-if="formModel.type" class="widget-options">
        <div class="widget-section-header">
          <h3>{{ formModel.type }} Options</h3>
        </div>
        <component :is="optionsComponent" :options.sync="formModel.widgetOptions" />
      </div>

      <div class="widget-section-header"><h3>Data Source</h3></div>
      <el-card shadow="never" class="widget-section-body item-card">
        <el-row :gutter="10">
          <el-col :span="22">
            <el-form-item label-width="175px" label="Connection" prop="connectionId">
              <ConnectionSelect v-model="formModel.connectionId" width="100%" size="mini" />
            </el-form-item>
          </el-col>
          <el-col :span="2"></el-col>
          <el-col :span="22">
            <el-form-item label-width="175px" label="Topic Pattern" prop="topicPattern">
              <TopicSelect
                v-model="formModel.topicPattern"
                :connection-id="formModel.connectionId || ''"
                width="100%"
                size="mini"
              />
            </el-form-item>
          </el-col>
          <el-col :span="2"></el-col>
          <el-col :span="22">
            <el-form-item label-width="175px" label="Value Field" title="JSON path or field name for data extraction">
              <el-input size="mini" v-model="formModel.valueField" placeholder="$.temp or temp" />
            </el-form-item>
          </el-col>
          <el-col :span="2"></el-col>
        </el-row>
      </el-card>

      <div class="widget-section-header"><h3>Schema Support</h3></div>
      <el-card shadow="never" class="widget-section-body item-card">
        <el-row :gutter="10">
          <el-col :span="22">
            <el-form-item label-width="175px" label="Schema Type">
              <el-select size="mini" v-model="formModel.schemaType">
                <el-option label="None" :value="undefined" />
                <el-option label="Protobuf" value="protobuf" />
                <el-option label="Avro" value="avro" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="2"></el-col>
          <el-col :span="22">
            <el-form-item label-width="175px" label="Schema" title="Select stored schema">
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
          </el-col>
          <el-col :span="2"></el-col>
          <el-col v-if="formModel.schemaType === 'protobuf'" :span="22">
            <el-form-item label-width="175px" label="Message Name" title="Protobuf message name">
              <el-input size="mini" v-model="formModel.schemaMessageName" placeholder="MyMessage" />
            </el-form-item>
          </el-col>
          <el-col v-if="formModel.schemaType === 'protobuf'" :span="2"></el-col>
          <el-col :span="22">
            <el-form-item label-width="175px" label="Fallback Value" title="Default value when no data is available">
              <el-input type="number" size="mini" v-model.number="formModel.fallbackValue" placeholder="0" />
            </el-form-item>
          </el-col>
          <el-col :span="2"></el-col>
        </el-row>
      </el-card>
    </el-form>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import BigNumberConfig from '@/components/widget-configs/BigNumberConfig.vue'
import GaugeConfig from '@/components/widget-configs/GaugeConfig.vue'
import LineConfig from '@/components/widget-configs/LineConfig.vue'
import ConnectionSelect from '@/components/ConnectionSelect.vue'
import TopicSelect from '@/components/TopicSelect.vue'
import type { WidgetModel, WidgetType } from '@/types/widgets'
import { widgetRegistry } from '@/widgets/widgetRegistry'
import WidgetRenderer from '@/widgets/WidgetRenderer.vue'
import useServices from '@/database/useServices'

@Component({
  components: { ConnectionSelect, TopicSelect, WidgetRenderer, BigNumberConfig, GaugeConfig, LineConfig },
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

  get availableTypes() {
    return widgetRegistry.getAvailableTypes()
  }

  @Watch('formModel.type')
  onTypeChange(newType: WidgetType) {
    this.formModel.widgetOptions = { ...widgetRegistry.getDefaultOptions(newType) }
  }

  get previewWidget(): WidgetModel | null {
    if (!this.formModel.type) return null

    const defaults = widgetRegistry.getDefaultOptions(this.formModel.type || 'Big Number')

    return {
      id: 'preview-widget',
      dashboardId: 'preview',
      type: this.formModel.type || '',
      title: this.formModel.title || defaults.title || 'Widget',
      schemaType: this.formModel.schemaType,
      schemaId: this.formModel.schemaId || '',
      schemaMessageName: this.formModel.schemaMessageName || '',
      fallbackValue: this.formModel.fallbackValue || 0,
      widgetOptions: { ...defaults, ...this.formModel.widgetOptions },
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
    this.applyInitial()
    await this.loadSchemas()

    const currentType = this.formModel.type as WidgetType
    if (currentType) {
      this.formModel.widgetOptions = {
        ...widgetRegistry.getDefaultOptions(currentType),
        ...this.formModel.widgetOptions,
      }
    }
  }

  @Watch('initialWidget', { immediate: false })
  onInitialWidgetChanged() {
    this.applyInitial()
  }

  @Watch('formModel.schemaType')
  async onSchemaTypeChange() {
    await this.loadSchemas()
    this.formModel.schemaId = ''
    this.formModel.schemaMessageName = ''
  }

  private applyInitial() {
    if (!this.initialWidget) {
      return
    }
    this.formModel = {
      ...this.formModel,
      ...this.initialWidget,
    }
  }

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
    return null
  }

  get previewChartData() {
    return []
  }

  private get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  private handleSave() {
    this.vueForm.validate((valid: boolean) => {
      if (!valid) {
        this.$message.warning(String(this.$t('common.inputValidationFailed') || 'Please check required fields'))
        return
      }

      try {
        if (!this.formModel.type) {
          throw new Error('Widget type is required')
        }

        if (!this.formModel.connectionId) {
          throw new Error('Connection is required')
        }

        if (!this.formModel.topicPattern) {
          throw new Error('Topic pattern is required')
        }

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
    a {
      -webkit-app-region: no-drag;
    }
  }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background-color: var(--color-bg-primary);
  }
  .el-form {
    padding-top: 20px;
  }

  .preview-card {
    margin-bottom: 12px;
    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      h3 {
        margin: 0;
      }
      .icon-oper {
        color: var(--color-text-tips);
        transition: 0.2s color ease;
        &:hover {
          color: var(--color-text-title);
        }
        .el-icon-refresh-right {
          font-size: 16px;
        }
      }
    }
    .preview-body {
      width: 100%;
      height: 260px;
      display: flex;
      align-items: center;
      justify-content: center;
      .preview-placeholder {
        color: var(--color-text-light);
      }
      .preview-widget {
        width: 100%;
        height: 100%;
      }
    }
  }
  .widget-options {
    width: 100%;
    .widget-section-header {
      margin: 16px 0 8px 0;
      h3 {
        margin: 0;
        font-size: 14px;
      }
    }
    .item-card {
      margin-bottom: 12px;
    }
  }

  .el-card {
    margin: 12px 0;
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
    color: var(--color-main-green-hover);
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

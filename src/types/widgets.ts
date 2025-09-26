export type ParsingMethod = 'auto' | 'json' | 'plaintext' | 'base64' | 'hex'

export type WidgetType = 'Big Number' | 'Gauge' | 'Line'

export interface WidgetModel {
  id?: string
  type: WidgetType
  title?: string

  x: number
  y: number
  w: number
  h: number
  static?: boolean
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number

  dashboardId: string

  connectionId?: string
  topicPattern?: string
  valueField?: string
  fallbackValue: number

  schemaType?: 'protobuf' | 'avro'
  schemaId?: string
  schemaMessageName?: string

  widgetOptions?: GaugeWidgetOptions | BigNumberWidgetOptions | LineWidgetOptions

  createAt?: string
  updateAt?: string
}

export interface BaseParsingConfig {
  method: ParsingMethod
  jsonPath?: string
  fallbackValue?: number
  multiFieldHandling?: 'first' | 'last' | 'average' | 'select' | 'all'
  selectedFields?: string[]
}

export interface BaseFormattingConfig {
  decimals?: number
  prefix?: string
  suffix?: string
}

export interface GaugeWidgetOptions {
  thresholdsType?: 'Absolute' | 'Percentage'
  min?: number
  max?: number
  thresholds?: Threshold[]
  decimals?: number
  unit?: string
  color?: string
}

export interface BigNumberWidgetOptions {
  thresholdsType?: 'Absolute' | 'Percentage'
  thresholds?: Threshold[]
  min?: number
  max?: number
  decimals?: number
  unit?: string
  color?: string
}

export interface LineWidgetOptions {
  thresholdsType?: 'Absolute' | 'Percentage'
  thresholds?: Threshold[]
  smooth?: boolean
  area?: boolean
  color?: string
}

export interface Threshold {
  value: number
  color: string
}

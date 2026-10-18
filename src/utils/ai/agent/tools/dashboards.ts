import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { AgentToolDeps } from './types'
import { emitAgentDataChanged } from '../agentEvents'

const WIDGET_TYPES = ['Big Number', 'Gauge', 'Line'] as const
type WidgetTypeName = typeof WIDGET_TYPES[number]

/** Same defaults the "add widget" form uses when the type changes */
const DEFAULT_WIDGET_OPTIONS: Record<WidgetTypeName, Record<string, unknown>> = {
  'Big Number': { thresholds: [], thresholdsType: 'Absolute', decimals: 1, unit: '', color: '#00B572' },
  Gauge: { thresholds: [], thresholdsType: 'Absolute', decimals: 1, unit: '', color: '#00B572' },
  Line: { smooth: true, area: true, color: '#00B572' },
}

interface WidgetInput {
  type: WidgetTypeName
  min?: number
  max?: number
  decimals?: number
  unit?: string
  color?: string
  smooth?: boolean
  area?: boolean
  thresholdsType?: 'Absolute' | 'Percentage'
  thresholds?: { value: number; color: string }[]
}

const collectOptions = (input: WidgetInput): Record<string, unknown> => {
  const options: Record<string, unknown> = {}
  for (const key of [
    'min',
    'max',
    'decimals',
    'unit',
    'color',
    'smooth',
    'area',
    'thresholdsType',
    'thresholds',
  ] as const) {
    if (input[key] !== undefined) options[key] = input[key]
  }
  return options
}

/**
 * Dashboard tools. Widgets read the messages a connection already received, matched by topicPattern,
 * so the connection must be subscribed to those topics. New widgets get the same layout as the page.
 */
export const createDashboardTools = (deps: AgentToolDeps): ToolSet => ({
  list_dashboards: tool({
    title: 'List dashboards',
    description:
      'List the dashboards with a summary of their widgets (type, title, connection, topicPattern, valueField).',
    inputSchema: z.object({}),
    execute: async () => {
      const dashboards = await deps.services.dashboardService.cascadeGetAll()
      return {
        dashboards: dashboards.map((dashboard) => ({
          id: dashboard.id,
          name: dashboard.name,
          description: dashboard.description ?? '',
          widgets: (dashboard.widgets ?? []).map((widget) => ({
            id: widget.id,
            type: widget.type,
            title: widget.title ?? '',
            connectionId: widget.connectionId ?? '',
            topicPattern: widget.topicPattern ?? '',
            valueField: widget.valueField ?? '',
          })),
        })),
      }
    },
  }),

  save_dashboard: tool({
    title: 'Save dashboard',
    description: 'Create a dashboard, or rename / change the description of one by id.',
    inputSchema: z.object({
      id: z.string().optional().describe('Update this dashboard; omit to create a new one'),
      name: z.string().describe('Dashboard name'),
      description: z.string().optional(),
    }),
    execute: async ({ id, name, description }) => {
      if (id) {
        const updated = await deps.services.dashboardService.update(id, { name, description })
        if (!updated) throw new Error(`Dashboard ${id} not found`)
        emitAgentDataChanged('dashboards')
        return { id: updated.id, name: updated.name }
      }
      const created = await deps.services.dashboardService.create({
        name,
        description,
        widgets: [],
      } as unknown as DashboardModel)
      if (!created?.id) throw new Error('The dashboard could not be created')
      emitAgentDataChanged('dashboards')
      return { id: created.id, name: created.name }
    },
  }),

  save_widget: tool({
    title: 'Save widget',
    description:
      'Create a widget on a dashboard, or update one by id. A widget reads the messages a connection already received: ' +
      'it matches topicPattern (wildcards allowed) and takes the number at valueField (a JSON path such as temp or $.temp), ' +
      'falling back to fallbackValue. The connection must be subscribed to those topics. New widgets are placed under the existing ones.',
    inputSchema: z.object({
      id: z.string().optional().describe('Update this widget; omit to create a new one'),
      dashboardId: z.string().describe('Dashboard id from list_dashboards'),
      type: z.enum(WIDGET_TYPES),
      title: z.string().optional(),
      connectionId: z.string().describe('Connection the messages come from'),
      topicPattern: z.string().describe('MQTT topic filter, wildcards allowed'),
      valueField: z.string().optional().describe('JSON path or field name of the number to show'),
      fallbackValue: z.number().optional().describe('Value shown when nothing matches, default 0'),
      min: z.number().optional(),
      max: z.number().optional(),
      decimals: z.number().optional(),
      unit: z.string().optional(),
      color: z.string().optional(),
      smooth: z.boolean().optional().describe('Line only'),
      area: z.boolean().optional().describe('Line only'),
      thresholdsType: z.enum(['Absolute', 'Percentage']).optional(),
      thresholds: z.array(z.object({ value: z.number(), color: z.string() })).optional(),
      schemaType: z.enum(['protobuf', 'avro']).optional().describe('Decode the payload with this schema'),
      schemaId: z.string().optional().describe('Schema id from list_scripts'),
      schemaMessageName: z.string().optional().describe('Protobuf message name'),
    }),
    execute: async (input) => {
      const { widgetService, dashboardService } = deps.services
      const dashboards = await dashboardService.getAll()
      if (!dashboards.some((dashboard) => dashboard.id === input.dashboardId)) {
        throw new Error(`Dashboard ${input.dashboardId} not found`)
      }
      const widgetOptions = { ...DEFAULT_WIDGET_OPTIONS[input.type], ...collectOptions(input) }
      const fields = {
        type: input.type,
        title: input.title,
        connectionId: input.connectionId,
        topicPattern: input.topicPattern,
        valueField: input.valueField,
        fallbackValue: input.fallbackValue ?? 0,
        schemaType: input.schemaType,
        schemaId: input.schemaId,
        schemaMessageName: input.schemaMessageName,
        widgetOptions,
      }
      if (input.id) {
        const existing = await widgetService.get(input.id)
        if (!existing) throw new Error(`Widget ${input.id} not found`)
        const updated = await widgetService.update(input.id, {
          ...existing,
          ...fields,
          title: input.title ?? existing.title,
        })
        emitAgentDataChanged('dashboards')
        return { id: updated?.id ?? input.id, title: input.title ?? existing.title }
      }
      const widgets = await widgetService.getAll(input.dashboardId)
      const maxY = Math.max(0, ...widgets.map((widget) => widget.y + widget.h))
      const created = await widgetService.create({
        ...fields,
        title: input.title || `${input.type} Widget`,
        dashboardId: input.dashboardId,
        x: 0,
        y: maxY,
        w: 4,
        h: 6,
        static: false,
      } as WidgetModel)
      if (!created?.id) throw new Error('The widget could not be created')
      emitAgentDataChanged('dashboards')
      return { id: created.id, title: created.title }
    },
  }),

  delete_dashboard: tool({
    title: 'Delete dashboard',
    description: 'Delete a dashboard and all of its widgets.',
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => {
      const deleted = await deps.services.dashboardService.delete(id)
      if (!deleted) throw new Error(`Dashboard ${id} not found`)
      emitAgentDataChanged('dashboards')
      return { deleted: true, name: deleted.name }
    },
  }),

  delete_widget: tool({
    title: 'Delete widget',
    description: 'Delete one widget from its dashboard.',
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => {
      const deleted = await deps.services.widgetService.delete(id)
      if (!deleted) throw new Error(`Widget ${id} not found`)
      emitAgentDataChanged('dashboards')
      return { deleted: true, title: deleted.title }
    },
  }),
})

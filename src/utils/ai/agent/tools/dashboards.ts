import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { AgentToolDeps } from './types'
import { emitAgentDataChanged } from '../agentEvents'

const WIDGET_TYPES = ['Big Number', 'Gauge', 'Line'] as const
type WidgetTypeName = typeof WIDGET_TYPES[number]

/** The dashboard grid: 12 columns, 30px per row, widgets compact upwards (see DashboardView) */
const GRID_COLUMNS = 12
const GRID_ROW_HEIGHT = 30
/** Same defaults the "add widget" form uses */
const DEFAULT_WIDGET_WIDTH = 4
const DEFAULT_WIDGET_HEIGHT = 6
const MIN_WIDGET_HEIGHT = 2

type WidgetLayout = Pick<WidgetModel, 'x' | 'y' | 'w' | 'h'>

/**
 * Checks one widget layout against the dashboard grid and throws with the legal range, so the model can
 * correct the call instead of getting a silently truncated widget.
 */
export const assertWidgetLayout = (layout: WidgetLayout): WidgetLayout => {
  const { x, y, w, h } = layout
  if (![x, y, w, h].every(Number.isInteger)) {
    throw new Error(
      `The layout must be whole grid cells (got x=${x}, y=${y}, w=${w}, h=${h}). ` +
        `x: column 0-${
          GRID_COLUMNS - 1
        }, y: row 0 or more, w: 1-${GRID_COLUMNS} columns, h: at least ${MIN_WIDGET_HEIGHT} rows.`,
    )
  }
  if (x < 0 || x > GRID_COLUMNS - 1) {
    throw new Error(`x must be a column between 0 and ${GRID_COLUMNS - 1} (got ${x})`)
  }
  if (y < 0) {
    throw new Error(`y must be 0 or more rows of ${GRID_ROW_HEIGHT}px (got ${y})`)
  }
  if (w < 1 || w > GRID_COLUMNS) {
    throw new Error(`w must be 1 to ${GRID_COLUMNS} columns wide (got ${w})`)
  }
  if (h < MIN_WIDGET_HEIGHT) {
    throw new Error(`h must be at least ${MIN_WIDGET_HEIGHT} rows of ${GRID_ROW_HEIGHT}px (got ${h})`)
  }
  if (x + w > GRID_COLUMNS) {
    throw new Error(
      `x + w must be at most ${GRID_COLUMNS} columns, so a widget at x=${x} can be at most ${
        GRID_COLUMNS - x
      } wide (got w=${w})`,
    )
  }
  return layout
}

/**
 * Where a new widget goes when the caller gives no position: the first free spot, row by row from the
 * top and left to right, that does not overlap any widget; otherwise a fresh row below every widget.
 */
export const nextWidgetPosition = (widgets: WidgetLayout[], w: number, h: number): { x: number; y: number } => {
  const bottom = Math.max(0, ...widgets.map((widget) => widget.y + widget.h))
  const overlaps = (x: number, y: number) =>
    widgets.some((widget) => x < widget.x + widget.w && widget.x < x + w && y < widget.y + widget.h && widget.y < y + h)
  for (let y = 0; y < bottom; y++) {
    for (let x = 0; x + w <= GRID_COLUMNS; x++) {
      if (!overlaps(x, y)) return { x, y }
    }
  }
  return { x: 0, y: bottom }
}

/** Same defaults the "add widget" form uses when the type changes */
const DEFAULT_WIDGET_OPTIONS: Record<WidgetTypeName, Record<string, unknown>> = {
  'Big Number': { thresholds: [], thresholdsType: 'Absolute', decimals: 1, unit: '', color: '#00B572' },
  Gauge: { thresholds: [], thresholdsType: 'Absolute', decimals: 1, unit: '', color: '#00B572' },
  Line: { smooth: true, area: true, color: '#00B572' },
}

interface WidgetInput {
  type?: WidgetTypeName
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
 * so the connection must be subscribed to those topics. Widgets are placed on the shared 12-column
 * dashboard grid (see DashboardView), 30px per row.
 */
export const createDashboardTools = (deps: AgentToolDeps): ToolSet => ({
  list_dashboards: tool({
    title: 'List dashboards',
    description:
      'List the dashboards with a summary of their widgets (type, title, connection, topicPattern, valueField ' +
      `and the x/y/w/h layout on the ${GRID_COLUMNS}-column grid). To rearrange a dashboard, list it first to see ` +
      'where the widgets are, then call save_widget with the widget id and the new x/y/w/h.',
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
            x: widget.x,
            y: widget.y,
            w: widget.w,
            h: widget.h,
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
      'falling back to fallbackValue. The connection must be subscribed to those topics. ' +
      `Layout: the dashboard is a grid of ${GRID_COLUMNS} columns, x is the column 0-${
        GRID_COLUMNS - 1
      }, w is the width in ` +
      `columns (1-${GRID_COLUMNS}), y and h count rows of ${GRID_ROW_HEIGHT}px, and x + w must not exceed ${GRID_COLUMNS}. ` +
      'Common sizes: Big Number and Gauge 3x4 or 4x5, Line 6x8 or 12x8; divide 12 by how many widgets you want per row. ' +
      'Without x/y a new widget goes to the right of the last row, or on a new row below the others when it does not fit. ' +
      'Updating with an id changes only the fields you pass, so moving a widget needs just its id, dashboardId and x/y/w/h.',
    inputSchema: z.object({
      id: z.string().optional().describe('Update this widget; omit to create a new one'),
      dashboardId: z.string().describe('Dashboard id from list_dashboards'),
      type: z.enum(WIDGET_TYPES).optional().describe('Required when creating'),
      title: z.string().optional(),
      connectionId: z.string().optional().describe('Connection the messages come from; required when creating'),
      topicPattern: z.string().optional().describe('MQTT topic filter, wildcards allowed; required when creating'),
      valueField: z.string().optional().describe('JSON path or field name of the number to show'),
      fallbackValue: z.number().optional().describe('Value shown when nothing matches, default 0'),
      x: z
        .number()
        .optional()
        .describe(`Grid column 0-${GRID_COLUMNS - 1}; default: right of the last row, or 0 on a new row`),
      y: z.number().optional().describe(`Grid row, ${GRID_ROW_HEIGHT}px each; default: the last row`),
      w: z.number().optional().describe(`Width in grid columns 1-${GRID_COLUMNS}; default ${DEFAULT_WIDGET_WIDTH}`),
      h: z
        .number()
        .optional()
        .describe(
          `Height in grid rows of ${GRID_ROW_HEIGHT}px, at least ${MIN_WIDGET_HEIGHT}; default ${DEFAULT_WIDGET_HEIGHT}`,
        ),
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
      const source = {
        type: input.type,
        title: input.title,
        connectionId: input.connectionId,
        topicPattern: input.topicPattern,
        valueField: input.valueField,
        fallbackValue: input.fallbackValue,
        schemaType: input.schemaType,
        schemaId: input.schemaId,
        schemaMessageName: input.schemaMessageName,
      }
      if (input.id) {
        const existing = await widgetService.get(input.id)
        if (!existing) throw new Error(`Widget ${input.id} not found`)
        const layout = assertWidgetLayout({
          x: input.x ?? existing.x,
          y: input.y ?? existing.y,
          w: input.w ?? existing.w,
          h: input.h ?? existing.h,
        })
        // Only the fields that were passed change; a new type starts from that type's default options
        const changed = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined))
        const baseOptions =
          input.type && input.type !== existing.type ? DEFAULT_WIDGET_OPTIONS[input.type] : existing.widgetOptions
        const widgetOptions = { ...baseOptions, ...collectOptions(input) }
        const updated = await widgetService.update(input.id, { ...existing, ...changed, widgetOptions, ...layout })
        emitAgentDataChanged('dashboards')
        return { id: updated?.id ?? input.id, title: updated?.title ?? existing.title, ...layout }
      }
      const { type, connectionId, topicPattern } = input
      if (!type || !connectionId || !topicPattern) {
        throw new Error('type, connectionId and topicPattern are required to create a widget')
      }
      const widgets = await widgetService.getAll(input.dashboardId)
      const width = input.w ?? DEFAULT_WIDGET_WIDTH
      const height = input.h ?? DEFAULT_WIDGET_HEIGHT
      const fallback = nextWidgetPosition(widgets, width, height)
      const layout = assertWidgetLayout({
        x: input.x ?? fallback.x,
        y: input.y ?? fallback.y,
        w: width,
        h: height,
      })
      const created = await widgetService.create({
        ...source,
        type,
        connectionId,
        topicPattern,
        fallbackValue: input.fallbackValue ?? 0,
        widgetOptions: { ...DEFAULT_WIDGET_OPTIONS[type], ...collectOptions(input) },
        title: input.title || `${type} Widget`,
        dashboardId: input.dashboardId,
        ...layout,
        static: false,
      } as WidgetModel)
      if (!created?.id) throw new Error('The widget could not be created')
      emitAgentDataChanged('dashboards')
      return { id: created.id, title: created.title, ...layout }
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

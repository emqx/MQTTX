import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { AgentToolDeps } from './types'

const PAGES = {
  connections: '/recent_connections',
  script: '/script',
  'topic-tree': '/viewer/topic_tree',
  dashboard: '/viewer/dashboard',
  log: '/log',
  settings: '/settings',
} as const

const DASHBOARD_STORAGE_KEY = 'mqttx_last_dashboard_id'

/** Lets the agent take the user to a page; the floating window stays open so both are visible */
export const createPageTools = (deps: AgentToolDeps): ToolSet => ({
  open_page: tool({
    title: 'Open page',
    description:
      'Open one of the MQTTX pages so the user can see the result. Use it after creating or changing something when the user may want to look at it.',
    inputSchema: z.object({
      page: z.enum(['connections', 'script', 'topic-tree', 'dashboard', 'log', 'settings']),
      id: z.string().optional().describe('Dashboard id to open when page is "dashboard"'),
    }),
    execute: async ({ page, id }) => {
      if (page === 'dashboard' && id) {
        try {
          localStorage.setItem(DASHBOARD_STORAGE_KEY, id)
        } catch {
          // localStorage is not available; the dashboard opens on its last selection
        }
      }
      await deps.router.push(PAGES[page])
      return { opened: page, path: PAGES[page] }
    },
  }),
})

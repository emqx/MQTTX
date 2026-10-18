import type { Route } from 'vue-router'

/** Name of the route that shows the Agent as a full page */
export const AGENT_ROUTE_NAME = 'Agent'

/** Where the full page returns to when there is no remembered page (for example after a reload) */
export const AGENT_FALLBACK_LOCATION = '/recent_connections'

export interface AgentRouteLocation {
  name: string
  params: { conversationId?: string }
}

/** The full page is the Agent route; on any other page the panel is the float window */
export const panelModeForRoute = (routeName: string | null | undefined): 'float' | 'full' =>
  routeName === AGENT_ROUTE_NAME ? 'full' : 'float'

export const isAgentRoute = (routeName: string | null | undefined): boolean => routeName === AGENT_ROUTE_NAME

/** Location of the Agent page, optionally pinned to one conversation */
export const agentRouteLocation = (conversationId?: string | null): AgentRouteLocation =>
  conversationId ? { name: AGENT_ROUTE_NAME, params: { conversationId } } : { name: AGENT_ROUTE_NAME, params: {} }

/** Where leaving full screen goes: the page the user came from, or Connections when there is none */
export const leaveFullScreenTarget = (previousLocation: string | null | undefined): string =>
  previousLocation && previousLocation.trim() ? previousLocation : AGENT_FALLBACK_LOCATION

/** A page worth remembering as the full page's previous page; the start route and the Agent route are not */
export const previousLocationForRoute = (route: Pick<Route, 'name' | 'fullPath'> | null | undefined): string | null => {
  if (!route || !route.name || route.name === AGENT_ROUTE_NAME) return null
  return route.fullPath === '/' ? null : route.fullPath
}

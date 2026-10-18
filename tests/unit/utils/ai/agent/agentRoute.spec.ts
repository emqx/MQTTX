import { expect } from 'chai'
import {
  AGENT_FALLBACK_LOCATION,
  AGENT_ROUTE_NAME,
  agentRouteLocation,
  isAgentRoute,
  leaveFullScreenTarget,
  panelModeForRoute,
  previousLocationForRoute,
} from '@/utils/ai/agent/agentRoute'

describe('agentRoute', () => {
  describe('panelModeForRoute', () => {
    it('should be full on the Agent route', () => {
      expect(panelModeForRoute(AGENT_ROUTE_NAME)).to.equal('full')
    })

    it('should be float on any other page', () => {
      expect(panelModeForRoute('Settings')).to.equal('float')
      expect(panelModeForRoute(undefined)).to.equal('float')
      expect(panelModeForRoute(null)).to.equal('float')
    })
  })

  describe('isAgentRoute', () => {
    it('should match only the Agent route', () => {
      expect(isAgentRoute(AGENT_ROUTE_NAME)).to.equal(true)
      expect(isAgentRoute('Connections')).to.equal(false)
      expect(isAgentRoute(undefined)).to.equal(false)
    })
  })

  describe('agentRouteLocation', () => {
    it('should pin the conversation when there is one', () => {
      expect(agentRouteLocation('c1')).to.deep.equal({ name: AGENT_ROUTE_NAME, params: { conversationId: 'c1' } })
    })

    it('should omit the param without a conversation', () => {
      expect(agentRouteLocation(null)).to.deep.equal({ name: AGENT_ROUTE_NAME, params: {} })
    })
  })

  describe('leaveFullScreenTarget', () => {
    it('should return to the remembered page', () => {
      expect(leaveFullScreenTarget('/script')).to.equal('/script')
    })

    it('should fall back to Connections without a remembered page', () => {
      expect(leaveFullScreenTarget(null)).to.equal(AGENT_FALLBACK_LOCATION)
      expect(leaveFullScreenTarget('  ')).to.equal(AGENT_FALLBACK_LOCATION)
    })
  })

  describe('previousLocationForRoute', () => {
    it('should remember a normal page', () => {
      expect(previousLocationForRoute({ name: 'Script', fullPath: '/script' })).to.equal('/script')
    })

    it('should not remember the start route or the Agent route', () => {
      expect(previousLocationForRoute({ name: 'Home', fullPath: '/' })).to.equal(null)
      expect(previousLocationForRoute({ name: AGENT_ROUTE_NAME, fullPath: '/agent/c1' })).to.equal(null)
      expect(previousLocationForRoute(null)).to.equal(null)
    })
  })
})

import { describe, it, expect, vi } from 'vitest'
import type { RouteRecordRaw, RouteLocationNormalized } from 'vue-router'
import { getRoutes, createRouterGuard } from '../index'

// Mock components for testing
const mockConnectionsComponent = vi.fn()
const mockConnectionDetailsComponent = vi.fn()

// Construct a component map for testing based on your routes.json
const componentMap = {
  ConnectionsComponent: mockConnectionsComponent,
  ConnectionDetailsComponent: mockConnectionDetailsComponent,
}

describe('Router', () => {
  it('getRoutes should resolve routes and children correctly', () => {
    const routes: RouteRecordRaw[] = getRoutes(componentMap)

    // Assert base routes are defined
    expect(routes).toBeDefined()
    expect(routes.length).toBeGreaterThan(0)

    // Assert the Connections route is correctly resolved
    const connectionsRoute = routes.find((r) => r.name === 'Connections')
    expect(connectionsRoute).toBeDefined()
    expect(connectionsRoute!.component).toBe(mockConnectionsComponent)

    // Assert the ConnectionDetail child route is correctly resolved
    const connectionDetailRoute = connectionsRoute!.children?.find((r) => r.name === 'ConnectionDetail')
    expect(connectionDetailRoute).toBeDefined()
    expect(connectionDetailRoute!.component).toBe(mockConnectionDetailsComponent)
    expect(connectionDetailRoute!.props).toBe(true)
  })
  it('should redirect to a connection detail page if there is a first connection ID', async () => {
    // Mock the getFirstConnectionId to return a specific ID
    const getFirstConnectionId = vi.fn(() => '123')
    const routerGuard = createRouterGuard(getFirstConnectionId)

    // Mock the to and from route objects
    const to = {
      name: 'Connections',
      params: {},
    } as RouteLocationNormalized

    const from = {} as RouteLocationNormalized

    // Mock the next function
    const next = vi.fn()

    // Call the router guard
    routerGuard(to, from, next)

    // Assert that getFirstConnectionId was called
    expect(getFirstConnectionId).toHaveBeenCalledTimes(1)

    // Assert that next was called with the correct argument
    expect(next).toHaveBeenCalledWith('/connections/123')
  })

  it('should not redirect if there is no first connection ID', async () => {
    // Mock the getFirstConnectionId to return null
    const getFirstConnectionId = vi.fn(() => null)
    const routerGuard = createRouterGuard(getFirstConnectionId)

    // Mock the to and from route objects
    const to = {
      name: 'Connections',
      params: {},
    } as RouteLocationNormalized

    const from = {} as RouteLocationNormalized

    // Mock the next function
    const next = vi.fn()

    // Call the router guard
    routerGuard(to, from, next)

    // Assert that getFirstConnectionId was called
    expect(getFirstConnectionId).toHaveBeenCalledTimes(1)

    // Assert that next was called without arguments, indicating no redirect
    expect(next).toHaveBeenCalledWith()
  })

  it('should proceed as normal if not navigating to "Connections"', async () => {
    // Mock the getFirstConnectionId to return an ID, it shouldn't be called in this case
    const getFirstConnectionId = vi.fn(() => '123')
    const routerGuard = createRouterGuard(getFirstConnectionId)

    // Mock the to and from route objects
    const to = {
      name: 'OtherPage',
      params: {},
    } as RouteLocationNormalized

    const from = {} as RouteLocationNormalized

    // Mock the next function
    const next = vi.fn()

    // Call the router guard
    routerGuard(to, from, next)

    // Assert that getFirstConnectionId was not called
    expect(getFirstConnectionId).not.toHaveBeenCalled()

    // Assert that next was called without arguments, indicating normal flow
    expect(next).toHaveBeenCalledWith()
  })
})

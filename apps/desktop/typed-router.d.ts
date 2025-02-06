/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'vue-router'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    '/about': RouteRecordInfo<'/about', '/about', Record<never, never>, Record<never, never>>,
    '/connections': RouteRecordInfo<'/connections', '/connections', Record<never, never>, Record<never, never>>,
    '/connections/': RouteRecordInfo<'/connections/', '/connections', Record<never, never>, Record<never, never>>,
    '/connections/[id]': RouteRecordInfo<'/connections/[id]', '/connections/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/connections/[id].edit': RouteRecordInfo<'/connections/[id].edit', '/connections/:id/edit', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/connections/create': RouteRecordInfo<'/connections/create', '/connections/create', Record<never, never>, Record<never, never>>,
    '/help': RouteRecordInfo<'/help', '/help', Record<never, never>, Record<never, never>>,
    '/log': RouteRecordInfo<'/log', '/log', Record<never, never>, Record<never, never>>,
    '/script': RouteRecordInfo<'/script', '/script', Record<never, never>, Record<never, never>>,
    '/settings': RouteRecordInfo<'/settings', '/settings', Record<never, never>, Record<never, never>>,
  }
}

import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { scriptTest } from '@/utils/scriptTest'
import { AgentToolDeps } from './types'
import { emitAgentDataChanged } from '../agentEvents'

const SCRIPT_TYPES = ['javascript', 'protobuf', 'avro'] as const
type ScriptType = typeof SCRIPT_TYPES[number]
const INPUT_TYPES = ['Plaintext', 'JSON', 'Base64', 'Hex'] as const

const EXTENSIONS: Record<ScriptType, string> = { javascript: 'js', protobuf: 'proto', avro: 'avsc' }

/** Adds the extension the Script page expects; a wrong extension is replaced, like the page does */
export const checkScriptExtension = (name: string, type: ScriptType): string => {
  const expected = `.${EXTENSIONS[type]}`
  const dot = name.lastIndexOf('.')
  if (dot === -1) return `${name}${expected}`
  return name.slice(dot) === expected ? name : `${name.slice(0, dot)}${expected}`
}

export const isSchemaType = (type: string | null | undefined): boolean => type === 'protobuf' || type === 'avro'

const appliedScript = (deps: AgentToolDeps): ScriptState | null =>
  (deps.store.getters.currentScript as ScriptState | null) ?? null

/**
 * Tools mirroring the Script page. Scripts are shared by every connection: applying one is a global
 * setting, and the model-written JavaScript of `test_script` always needs approval.
 */
export const createScriptTools = (deps: AgentToolDeps): ToolSet => ({
  list_scripts: tool({
    title: 'List scripts',
    description:
      'List the saved transformation functions and schemas with their id, name, type and whether they are currently applied. Does not return the script bodies.',
    inputSchema: z.object({
      kind: z.enum(['function', 'schema']).optional().describe('Only scripts of this kind'),
    }),
    execute: async ({ kind }) => {
      const { scriptService } = deps.services
      const scripts =
        kind === 'function'
          ? await scriptService.getAllFunction()
          : kind === 'schema'
          ? await scriptService.getAllSchema()
          : await scriptService.getAll()
      const applied = appliedScript(deps)
      return {
        scripts: (scripts ?? []).map((script) => ({
          id: script.id,
          name: script.name,
          type: script.type ?? '',
          kind: isSchemaType(script.type) ? 'schema' : 'function',
          inUse: applied?.function?.id === script.id || applied?.schema?.id === script.id,
        })),
      }
    },
  }),

  get_script: tool({
    title: 'Read script',
    description: 'Read the full body of one transformation function or schema by id.',
    inputSchema: z.object({ id: z.string().describe('Script id from list_scripts') }),
    execute: async ({ id }) => {
      const script = await deps.services.scriptService.get(id)
      if (!script) throw new Error(`Script ${id} not found`)
      return { id: script.id, name: script.name, type: script.type ?? '', script: script.script }
    },
  }),

  save_script: tool({
    title: 'Save script',
    description:
      'Create a transformation function or schema, or update one by id. The name gets the extension for the type (.js, .proto or .avsc). The name must be unique.',
    inputSchema: z.object({
      id: z.string().optional().describe('Update this script; omit to create a new one'),
      name: z.string().describe('Script name, for example payload.js'),
      type: z.enum(SCRIPT_TYPES).describe('javascript, protobuf or avro'),
      script: z.string().describe('The full script or schema body'),
    }),
    execute: async ({ id, name, type, script }) => {
      const finalName = checkScriptExtension(name.trim(), type)
      const all = (await deps.services.scriptService.getAll()) ?? []
      if (all.some((item) => item.name === finalName && item.id !== id)) {
        throw new Error(`A script named "${finalName}" already exists. Choose another name.`)
      }
      if (id) {
        const existing = await deps.services.scriptService.get(id)
        if (!existing) throw new Error(`Script ${id} not found`)
        const updated = await deps.services.scriptService.update(id, { ...existing, name: finalName, script, type })
        emitAgentDataChanged('scripts')
        return { id: updated?.id ?? id, name: finalName, type }
      }
      const created = await deps.services.scriptService.create({ name: finalName, script, type })
      if (!created?.id) throw new Error('The script could not be created')
      emitAgentDataChanged('scripts')
      return { id: created.id, name: created.name, type }
    },
  }),

  delete_script: tool({
    title: 'Delete script',
    description: 'Delete a saved script by id. A script that is currently applied cannot be deleted.',
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => {
      const script = await deps.services.scriptService.get(id)
      if (!script) throw new Error(`Script ${id} not found`)
      const applied = appliedScript(deps)
      if (applied?.function?.id === id || applied?.schema?.id === id) {
        throw new Error(
          `"${script.name}" is in use. Clear the applied script with clear_applied_script before deleting it.`,
        )
      }
      await deps.services.scriptService.delete(id)
      emitAgentDataChanged('scripts')
      return { deleted: true, name: script.name }
    },
  }),

  test_script: tool({
    title: 'Test script',
    description:
      'Run a transformation function or schema against sample input and return the output. ' +
      'Uses the same sandbox as the Script page. The script runs local code, so this always asks for approval.',
    inputSchema: z.object({
      id: z.string().optional().describe('Test a saved script by id'),
      script: z.string().optional().describe('Or test this script body directly'),
      type: z.enum(SCRIPT_TYPES).describe('javascript, protobuf or avro'),
      input: z.string().describe('The payload to run the script on'),
      inputType: z.enum(INPUT_TYPES).optional().describe('Input format, default Plaintext'),
      protoName: z.string().optional().describe('Protobuf message name; required for protobuf'),
    }),
    execute: async ({ id, script, type, input, inputType, protoName }) => {
      let body = script
      if (id) {
        const saved = await deps.services.scriptService.get(id)
        if (!saved) throw new Error(`Script ${id} not found`)
        body = saved.script
      }
      if (!body) throw new Error('Provide either "id" or "script".')
      if (type === 'protobuf' && !protoName) {
        throw new Error('Testing a Protobuf script needs "protoName" (the message name).')
      }
      const result = scriptTest(body, type, input, inputType ?? 'Plaintext', { name: protoName })
      return { result }
    },
  }),

  apply_script: tool({
    title: 'Apply script',
    description:
      'Apply a transformation function and/or schema to MQTTX. This is a global setting: it affects what every connection sends and receives. ' +
      'The user must confirm first. Protobuf schemas also need protoName.',
    inputSchema: z.object({
      functionId: z.string().optional().describe('Id of a JavaScript function to apply'),
      schemaId: z.string().optional().describe('Id of a Protobuf or Avro schema to apply'),
      protoName: z.string().optional().describe('Protobuf message name; required when the schema is Protobuf'),
      apply: z.enum(['all', 'received', 'publish']).describe('Which direction the script applies to'),
    }),
    execute: async ({ functionId, schemaId, protoName, apply }) => {
      if (!functionId && !schemaId) throw new Error('Provide at least one of "functionId" or "schemaId".')
      const func = functionId ? await deps.services.scriptService.get(functionId) : undefined
      if (functionId && !func) throw new Error(`Script ${functionId} not found`)
      const schema = schemaId ? await deps.services.scriptService.get(schemaId) : undefined
      if (schemaId && !schema) throw new Error(`Script ${schemaId} not found`)
      if (schema?.type === 'protobuf' && !protoName) {
        throw new Error('A Protobuf schema needs "protoName" (the message name).')
      }
      const currentScript: ScriptState = {
        apply,
        function: func ?? null,
        schema: schema ?? null,
        config: { name: protoName },
      }
      await deps.store.dispatch('SET_SCRIPT', { currentScript })
      emitAgentDataChanged('scripts')
      return {
        applied: {
          function: func?.name ?? null,
          schema: schema?.name ?? null,
          protoName: protoName ?? null,
          apply,
        },
      }
    },
  }),

  clear_applied_script: tool({
    title: 'Clear applied script',
    description: 'Remove the currently applied transformation function and schema. This is a global setting.',
    inputSchema: z.object({}),
    execute: async () => {
      await deps.store.dispatch('SET_SCRIPT', { currentScript: null })
      emitAgentDataChanged('scripts')
      return { cleared: true }
    },
  }),
})

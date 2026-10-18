import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { AGENT_SKILL_NAMES, CLI_REFERENCE_NAMES, loadSkill } from '../skills'

/** Read-only tool that loads the detailed instructions of one skill */
export const createSkillTools = (): ToolSet => ({
  use_skill: tool({
    title: 'Load skill',
    description:
      'Load the detailed instructions of one skill before doing the task it covers. ' +
      'Read the Skills section of your instructions to pick the right skill. ' +
      'Only mqttx_cli takes the optional "reference": after reading the skill, load one of its CLI ' +
      `references by name (${CLI_REFERENCE_NAMES.join(', ')}). Other skills have no references.`,
    inputSchema: z.object({
      skill: z.enum(AGENT_SKILL_NAMES).describe('The skill to load'),
      reference: z
        .enum(CLI_REFERENCE_NAMES)
        .optional()
        .describe('mqttx_cli only: the CLI reference to load, from the "Choose a workflow" table'),
    }),
    execute: async ({ skill, reference }) => ({ skill, instructions: loadSkill(skill, reference) }),
  }),
})

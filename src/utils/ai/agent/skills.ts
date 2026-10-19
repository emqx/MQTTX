import clientCodeGen from '../prompts/clientCodeGen.txt'
import payloadGen from '../prompts/payloadGen.txt'
import protobufSchemaGen from '../prompts/protobufSchemaGen.txt'
import avroSchemaGen from '../prompts/avroSchemaGen.txt'
import funcGen from '../prompts/funcGen.txt'
import mqttFaq from '../prompts/mqttFaq.txt'
import emqxGuide from '../prompts/emqxGuide.txt'
import mqttxDiagnostics from '../prompts/mqttxDiagnostics.txt'
// The MQTTX CLI skill is the repository's published skill, imported as raw text so there is one copy
import cliSkill from '../../../../skills/mqttx-cli/SKILL.md'
import cliWorkflows from '../../../../skills/mqttx-cli/references/workflows.md'
import cliConnections from '../../../../skills/mqttx-cli/references/connections.md'
import cliMqttFeatures from '../../../../skills/mqttx-cli/references/mqtt-features.md'
import cliPayloads from '../../../../skills/mqttx-cli/references/payloads.md'
import cliBenchmarks from '../../../../skills/mqttx-cli/references/benchmarks-and-simulation.md'
import cliConfiguration from '../../../../skills/mqttx-cli/references/configuration.md'
import cliCapabilities from '../../../../skills/mqttx-cli/references/capabilities.md'
import cliTroubleshooting from '../../../../skills/mqttx-cli/references/troubleshooting.md'

export const AGENT_SKILL_NAMES = [
  'client_code',
  'payload',
  'schema',
  'custom_function',
  'mqtt_knowledge',
  'mqttx_diagnostics',
  'mqttx_cli',
] as const
export type AgentSkillName = typeof AGENT_SKILL_NAMES[number]

/** One Element icon set for every skill; agent.scss sizes each glyph so they look the same */
export const SKILL_ICONS: Record<AgentSkillName, string> = {
  client_code: 'el-icon-edit-outline',
  payload: 'el-icon-s-data',
  schema: 'el-icon-document',
  custom_function: 'el-icon-s-operation',
  mqtt_knowledge: 'el-icon-reading',
  mqttx_diagnostics: 'el-icon-first-aid-kit',
  mqttx_cli: 'el-icon-monitor',
}

/** The on-demand references of the mqttx_cli skill, without the `.md` extension */
export const CLI_REFERENCE_NAMES = [
  'workflows',
  'connections',
  'mqtt-features',
  'payloads',
  'benchmarks-and-simulation',
  'configuration',
  'capabilities',
  'troubleshooting',
] as const
export type CliReferenceName = typeof CLI_REFERENCE_NAMES[number]

export interface AgentSkill {
  name: AgentSkillName
  description: string
}

const CLI_REFERENCES: Record<CliReferenceName, string> = {
  workflows: cliWorkflows,
  connections: cliConnections,
  'mqtt-features': cliMqttFeatures,
  payloads: cliPayloads,
  'benchmarks-and-simulation': cliBenchmarks,
  configuration: cliConfiguration,
  capabilities: cliCapabilities,
  troubleshooting: cliTroubleshooting,
}

const SAVE_FILES_NOTE =
  'When the result is more than a small snippet, save it as a runnable project with save_files instead of pasting the code into the chat: ' +
  'include the source files, a dependency manifest such as package.json or requirements.txt, and a README with the install and run steps. ' +
  'Write the README steps for macOS/Linux and Windows separately whenever they differ (for example python3 vs py, ' +
  'source .venv/bin/activate vs .venv\\Scripts\\activate, and the environment variable syntax), and call scripts in a way that does not need ' +
  'the executable bit, for example "sh run.sh" or "node run.js". After saving, reply with only a short summary and how to run it.'

const SAVE_SCHEMA_NOTE =
  'When the schema and its sample data are more than a small snippet, save them with save_files (the .proto or .avsc file and the sample data) ' +
  'instead of pasting them into the chat. After saving, reply with only a short summary and how to use them.'

const SAVE_SCRIPT_NOTE =
  'To use the result directly inside MQTTX, save it with save_script, verify it with test_script ' +
  '(the script is run in a sandbox and always needs approval), then apply it with apply_script. ' +
  'Applying a script is a global setting that affects what every connection sends and receives, so confirm with the user first.'

/** Put the connection the user is on into the code; ask once if the language or platform is unclear */
const CLIENT_CODE_NOTE =
  'Read the connection the user refers to with get_connection (or get_app_context) and use its host, port, protocol, ' +
  'WebSocket path, clientId, MQTT version, keepalive, clean session and certificate paths. Never print its password. ' +
  'If the user did not say which programming language, hardware platform or framework they want, ask for it in one short ' +
  'question before writing code; do not guess.'

/** Scenario guidance the model picks from the user's description (the user chooses no scenario in the menu) */
const PAYLOAD_SCENARIO_GUIDANCE = [
  'Simple: a small flat structure for basic testing.',
  'Complex: a larger structure with multi-device interaction and analysis fields.',
  'Connected car: vehicle telemetry, remote monitoring and driving data.',
  'Smart home: device automation and user behaviour patterns.',
  'Industrial IoT: machine performance, sensor readings and production line status.',
].join('\n- ')

/** MQTTX-Agent specific preamble for the published MQTTX CLI skill */
const CLI_PREAMBLE = `You are running inside the MQTTX Desktop app, so you cannot execute shell commands. The MQTTX CLI skill below is written for an agent that can run commands: when it says to run \`mqttx ...\` (for example \`mqttx --version\` or \`mqttx <command> --help\`), or to manage a process and its timeout, do not try to execute it. Instead give the user the exact command to copy and run, ask them to paste the output back, and continue from that output.

You can turn a connection the user already has in MQTTX into an equivalent CLI command: read it with \`get_connection\` and map host, port, protocol, path, clientId, MQTT version and certificate paths to the matching flags. Never put the password in the command; use a placeholder such as \`<PASSWORD>\` or a shell environment variable.

Give the commands for macOS/Linux and for Windows separately when quoting, line continuation or environment variables differ.`

export const AGENT_SKILLS: AgentSkill[] = [
  {
    name: 'client_code',
    description: 'Write production-ready MQTT client code for a programming language, hardware platform or framework.',
  },
  { name: 'payload', description: 'Generate MQTT test payloads for an IoT scenario.' },
  { name: 'schema', description: 'Create a Protobuf or Avro schema with sample data.' },
  { name: 'custom_function', description: 'Write an MQTTX message transformation function.' },
  { name: 'mqtt_knowledge', description: 'Answer in-depth MQTT protocol or EMQX questions.' },
  {
    name: 'mqttx_diagnostics',
    description: 'Diagnose a connection, subscription or missing-message problem from MQTTX data and logs.',
  },
  { name: 'mqttx_cli', description: 'Give runnable MQTTX CLI commands, or load one CLI reference on demand.' },
]

/** Removes the YAML front matter of a Markdown skill so only the body is sent to the model */
const stripFrontMatter = (markdown: string): string => markdown.replace(/^---\n[\s\S]*?\n---\n?/, '').trim()

/** Points the CLI skill's relative links at the `reference` parameter instead of a missing file */
const rewriteReferenceLinks = (markdown: string): string =>
  markdown
    .replace(
      /\[([^\]]+)\]\(references\/([a-z0-9-]+)\.md\)/g,
      (_match, label: string, ref: string) => `${label} (load it with use_skill('mqttx_cli', reference: '${ref}'))`,
    )
    .replace(
      /references\/([a-z0-9-]+)\.md/g,
      (_match, ref: string) => `\`${ref}\` (load it with use_skill('mqttx_cli', reference: '${ref}'))`,
    )

/**
 * Returns the guidance of one skill. The mqttx_cli skill can additionally load one of its references;
 * `reference` is rejected for every other skill.
 */
export const loadSkill = (name: string, reference?: string): string => {
  if (reference !== undefined && name !== 'mqttx_cli') {
    throw new Error(`Skill "${name}" has no references; the "reference" parameter is only valid for mqttx_cli.`)
  }
  switch (name) {
    case 'client_code':
      return `${clientCodeGen}\n\n${CLIENT_CODE_NOTE}\n\n${SAVE_FILES_NOTE}`
    case 'payload':
      return `${payloadGen}\n\nScenario guidance (pick from the user's description):\n- ${PAYLOAD_SCENARIO_GUIDANCE}`
    case 'schema':
      return `${protobufSchemaGen}\n\n${avroSchemaGen}\n\nPick Protobuf or Avro from the user's description (both guides are above).\n\n${SAVE_SCHEMA_NOTE}\n\n${SAVE_SCRIPT_NOTE}`
    case 'custom_function':
      return `${funcGen}\n\n${SAVE_SCRIPT_NOTE}`
    case 'mqtt_knowledge':
      return `${mqttFaq}\n\n${emqxGuide}`
    case 'mqttx_diagnostics':
      return mqttxDiagnostics
    case 'mqttx_cli': {
      if (reference === undefined) {
        return `${CLI_PREAMBLE}\n\n${rewriteReferenceLinks(stripFrontMatter(cliSkill))}`
      }
      if (!(CLI_REFERENCE_NAMES as readonly string[]).includes(reference)) {
        throw new Error(
          `Unknown mqttx_cli reference "${reference}". Valid references: ${CLI_REFERENCE_NAMES.join(', ')}.`,
        )
      }
      return `${CLI_PREAMBLE}\n\n${rewriteReferenceLinks(CLI_REFERENCES[reference as CliReferenceName])}`
    }
    default:
      throw new Error(`Unknown skill "${name}". Valid skills: ${AGENT_SKILL_NAMES.join(', ')}.`)
  }
}

/** The `## Skills` section of the system prompt: what each skill covers and when to load it */
export const renderSkillList = (): string =>
  [
    '## Skills',
    'Before writing client code, test payloads, schemas or custom functions, answering in-depth MQTT or EMQX questions, diagnosing a connection problem, or giving MQTTX CLI commands, call use_skill with the matching skill first and follow it.',
    '- client_code (Client Code): writing MQTT client or SDK code in a language, on a platform or with a framework.',
    '- payload (Test Data): generating test payloads for an IoT scenario.',
    '- schema (Schema): creating a Protobuf or Avro schema with sample data.',
    '- custom_function (Custom Function): writing an MQTTX message transformation function.',
    '- mqtt_knowledge (MQTT Knowledge): in-depth MQTT protocol or EMQX answers.',
    '- mqttx_diagnostics (Diagnostics): when a connection fails, a subscription fails or messages do not arrive; it walks through MQTTX data, logs and packet-level debugging.',
    `- mqttx_cli (MQTTX CLI): giving the user runnable mqttx commands. Pass reference with one of ${CLI_REFERENCE_NAMES.join(
      ', ',
    )} to load that CLI reference after reading the skill.`,
  ].join('\n')

/**
 * Skills whose id, description or localized name contains the query typed after `/`.
 * A whole-word match on the id or name comes first, so `/cli` picks MQTTX CLI before Client Code.
 */
export const filterSkills = (query: string, labels: Record<string, string> = {}): AgentSkill[] => {
  const needle = query.trim().toLowerCase()
  if (!needle) return AGENT_SKILLS
  const isWord = (skill: AgentSkill) =>
    `${skill.name} ${labels[skill.name] ?? ''}`
      .toLowerCase()
      .split(/[\s_]+/)
      .includes(needle)
  return AGENT_SKILLS.filter((skill) =>
    `${skill.name} ${skill.description} ${labels[skill.name] ?? ''}`.toLowerCase().includes(needle),
  ).sort((a, b) => Number(isWord(b)) - Number(isWord(a)))
}

/** The line added in front of the user text when the user picked a Skill from the `/` menu */
export const renderSkillPrompt = (skill: string): string =>
  `[Skill selected by the user: ${skill}] Call use_skill with that skill first, then follow it.`

/** The chip label of a selected Skill: its localized name */
export const renderSkillChip = (skill: string, t: (key: string) => string): string => t(`agent.skills.${skill}.name`)

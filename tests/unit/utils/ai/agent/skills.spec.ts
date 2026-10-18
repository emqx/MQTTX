import { expect } from 'chai'
import {
  AGENT_SKILLS,
  AGENT_SKILL_NAMES,
  CLI_REFERENCE_NAMES,
  filterSkills,
  loadSkill,
  renderSkillChip,
  renderSkillList,
  renderSkillPrompt,
} from '@/utils/ai/agent/skills'
import { createSkillTools } from '@/utils/ai/agent/tools/skills'
import cliSkill from '../../../../../skills/mqttx-cli/SKILL.md'
import cliTroubleshooting from '../../../../../skills/mqttx-cli/references/troubleshooting.md'
import clientCodeGen from '@/utils/ai/prompts/clientCodeGen.txt'
import payloadGen from '@/utils/ai/prompts/payloadGen.txt'
import protobufSchemaGen from '@/utils/ai/prompts/protobufSchemaGen.txt'
import avroSchemaGen from '@/utils/ai/prompts/avroSchemaGen.txt'
import funcGen from '@/utils/ai/prompts/funcGen.txt'
import mqttFaq from '@/utils/ai/prompts/mqttFaq.txt'
import emqxGuide from '@/utils/ai/prompts/emqxGuide.txt'
import mqttxDiagnostics from '@/utils/ai/prompts/mqttxDiagnostics.txt'

const firstLine = (text: string) => text.split('\n')[0].trim()

describe('agent skills', () => {
  describe('loadSkill', () => {
    it('should load every skill without parameters', () => {
      expect(AGENT_SKILL_NAMES).to.have.length(7)
      for (const name of AGENT_SKILL_NAMES) {
        expect(loadSkill(name), name).to.be.a('string').that.is.not.empty
      }
    })

    it('should return the client code guide and the connection note', () => {
      const result = loadSkill('client_code')

      expect(result).to.include(firstLine(clientCodeGen))
      expect(result).to.include('get_connection')
      expect(result).to.include('ask for it in one short question')
    })

    it('should keep the payload scenario guidance in the body', () => {
      const result = loadSkill('payload')

      expect(result).to.include(firstLine(payloadGen))
      expect(result).to.include('Smart home:')
      expect(result).to.include('Connected car:')
    })

    it('should include both schema guides', () => {
      const result = loadSkill('schema')

      expect(result).to.include(firstLine(protobufSchemaGen))
      expect(result).to.include(firstLine(avroSchemaGen))
      expect(result).to.include('Pick Protobuf or Avro')
    })

    it('should load the custom function and both knowledge guides', () => {
      expect(loadSkill('custom_function')).to.include(firstLine(funcGen))

      const knowledge = loadSkill('mqtt_knowledge')
      expect(knowledge).to.include(firstLine(mqttFaq))
      expect(knowledge).to.include(firstLine(emqxGuide))
    })

    it('should load the diagnostics flow', () => {
      expect(loadSkill('mqttx_diagnostics')).to.include(firstLine(mqttxDiagnostics))
    })

    it('should reject an unknown skill with the valid skills', () => {
      expect(() => loadSkill('nope')).to.throw(Error, /Valid skills: .*mqttx_cli/)
    })
  })

  describe('mqttx_cli', () => {
    it('should return the SKILL.md body with the MQTTX Agent preamble and no front matter', () => {
      const result = loadSkill('mqttx_cli')

      expect(result).to.include('cannot execute shell commands')
      expect(result).to.include('get_connection')
      // Content that comes from the published SKILL.md
      expect(result).to.include('# MQTTX CLI')
      expect(result).to.include('## Choose a workflow')
      expect(result).to.include(firstLine(cliSkill).replace('# ', ''))
      // YAML front matter must be stripped
      expect(result).to.not.include('name: mqttx-cli')
      expect(result).to.not.include('description: Use MQTTX CLI')
      expect(result.trim().startsWith('---')).to.equal(false)
    })

    it('should rewrite the relative reference links into use_skill hints', () => {
      const result = loadSkill('mqttx_cli')

      expect(result).to.not.include('(references/troubleshooting.md)')
      expect(result).to.include("use_skill('mqttx_cli', reference: 'troubleshooting')")
      expect(result).to.include("use_skill('mqttx_cli', reference: 'workflows')")
    })

    it('should load every reference', () => {
      for (const reference of CLI_REFERENCE_NAMES) {
        const result = loadSkill('mqttx_cli', reference)
        expect(result, reference).to.include('cannot execute shell commands')
        expect(result.length, reference).to.be.greaterThan(100)
      }

      expect(loadSkill('mqttx_cli', 'troubleshooting')).to.include(firstLine(cliTroubleshooting))
    })

    it('should reject an unknown reference', () => {
      expect(() => loadSkill('mqttx_cli', 'nope')).to.throw(Error, /Unknown mqttx_cli reference/)
    })

    it('should reject a reference for any other skill', () => {
      expect(() => loadSkill('payload', 'workflows')).to.throw(Error, /only valid for mqttx_cli/)
    })
  })

  describe('use_skill tool', () => {
    it('should accept the skill and its optional reference only', async () => {
      const tools = createSkillTools()

      const plain: any = await tools.use_skill.execute!({ skill: 'payload' } as any, {} as any)
      expect(plain.skill).to.equal('payload')
      expect(plain.instructions).to.include(firstLine(payloadGen))

      const withReference: any = await tools.use_skill.execute!(
        { skill: 'mqttx_cli', reference: 'workflows' } as any,
        {} as any,
      )
      expect(withReference.instructions).to.include('cannot execute shell commands')

      const schema: any = tools.use_skill.inputSchema
      expect(Object.keys(schema.shape ?? {})).to.deep.equal(['skill', 'reference'])
    })
  })

  describe('renderSkillList', () => {
    it('should list all seven skills and how to load a CLI reference', () => {
      const result = renderSkillList()

      expect(result).to.include('## Skills')
      for (const name of AGENT_SKILL_NAMES) {
        expect(result, name).to.include(`- ${name} `)
      }
      expect(result).to.include('Pass reference with one of workflows')
    })
  })

  describe('filterSkills', () => {
    it('should return every skill for an empty query', () => {
      expect(filterSkills('')).to.have.length(AGENT_SKILLS.length)
    })

    it('should match the skill id', () => {
      expect(filterSkills('pay').map((skill) => skill.name)).to.deep.equal(['payload'])
    })

    it('should match the localized name', () => {
      expect(filterSkills('连接诊断', { mqttx_diagnostics: '连接诊断' }).map((skill) => skill.name)).to.deep.equal([
        'mqttx_diagnostics',
      ])
    })

    it('should put a whole-word match before a partial one', () => {
      expect(filterSkills('cli', { client_code: 'Client Code', mqttx_cli: 'MQTTX CLI' })[0].name).to.equal('mqttx_cli')
    })

    it('should return nothing when nothing matches', () => {
      expect(filterSkills('zzz')).to.have.length(0)
    })
  })

  describe('renderSkillPrompt', () => {
    it('should name the selected skill', () => {
      expect(renderSkillPrompt('payload')).to.equal(
        '[Skill selected by the user: payload] Call use_skill with that skill first, then follow it.',
      )
    })
  })

  describe('renderSkillChip', () => {
    it('should use the localized name', () => {
      expect(renderSkillChip('client_code', (key) => key)).to.equal('agent.skills.client_code.name')
    })
  })
})

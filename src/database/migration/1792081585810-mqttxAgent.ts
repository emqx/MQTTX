import { MigrationInterface, QueryRunner } from 'typeorm'

export class mqttxAgent1792081585810 implements MigrationInterface {
  name = 'mqttxAgent1792081585810'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "CopilotEntity" RENAME TO "AgentMessageEntity"`)
    await queryRunner.query(`ALTER TABLE "SettingEntity" RENAME COLUMN "enableCopilot" TO "enableAgent"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "SettingEntity" RENAME COLUMN "enableAgent" TO "enableCopilot"`)
    await queryRunner.query(`ALTER TABLE "AgentMessageEntity" RENAME TO "CopilotEntity"`)
  }
}

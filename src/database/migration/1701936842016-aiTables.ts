import { MigrationInterface, QueryRunner } from 'typeorm'

export class aiTables1701936842016 implements MigrationInterface {
  name = 'aiTables1701936842016'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "CopilotEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "role" varchar NOT NULL,
                "content" text NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "CopilotEntity"
        `)
  }
}

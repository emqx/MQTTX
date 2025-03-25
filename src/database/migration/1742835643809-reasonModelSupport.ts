import { MigrationInterface, QueryRunner } from 'typeorm'

export class reasonModelSupport1742835643809 implements MigrationInterface {
  name = 'reasonModelSupport1742835643809'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_CopilotEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "role" varchar NOT NULL,
                "content" text NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "reasoning" text
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_CopilotEntity"("id", "role", "content", "createAt")
            SELECT "id",
                "role",
                "content",
                "createAt"
            FROM "CopilotEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "CopilotEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_CopilotEntity"
                RENAME TO "CopilotEntity"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "CopilotEntity"
                RENAME TO "temporary_CopilotEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "CopilotEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "role" varchar NOT NULL,
                "content" text NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            INSERT INTO "CopilotEntity"("id", "role", "content", "createAt")
            SELECT "id",
                "role",
                "content",
                "createAt"
            FROM "temporary_CopilotEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_CopilotEntity"
        `)
  }
}

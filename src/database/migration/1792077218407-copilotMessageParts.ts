import { MigrationInterface, QueryRunner } from 'typeorm'

export class copilotMessageParts1792077218407 implements MigrationInterface {
  name = 'copilotMessageParts1792077218407'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_CopilotEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "role" varchar NOT NULL,
                "content" text NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "reasoning" text,
                "parts" text
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_CopilotEntity"("id", "role", "content", "createAt", "reasoning")
            SELECT "id",
                "role",
                "content",
                "createAt",
                "reasoning"
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
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "reasoning" text
            )
        `)
    await queryRunner.query(`
            INSERT INTO "CopilotEntity"("id", "role", "content", "createAt", "reasoning")
            SELECT "id",
                "role",
                "content",
                "createAt",
                "reasoning"
            FROM "temporary_CopilotEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_CopilotEntity"
        `)
  }
}

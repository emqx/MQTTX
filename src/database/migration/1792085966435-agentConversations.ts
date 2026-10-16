import { MigrationInterface, QueryRunner } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

export class agentConversations1792085966435 implements MigrationInterface {
  name = 'agentConversations1792085966435'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "AgentConversationEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "title" varchar NOT NULL DEFAULT (''),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`ALTER TABLE "AgentMessageEntity" ADD COLUMN "conversationId" varchar`)
    await queryRunner.query(
      `CREATE INDEX "IDX_AgentMessageEntity_conversationId" ON "AgentMessageEntity" ("conversationId")`,
    )

    // Existing messages have no conversation; group them into one so they stay reachable
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) as count FROM "AgentMessageEntity"`)
    if (Number(count) > 0) {
      const conversationId = uuidv4()
      await queryRunner.query(
        `INSERT INTO "AgentConversationEntity"("id", "title") VALUES('${conversationId}', 'Previous conversation')`,
      )
      await queryRunner.query(
        `UPDATE "AgentMessageEntity" SET "conversationId" = '${conversationId}' WHERE "conversationId" IS NULL`,
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_AgentMessageEntity_conversationId"`)
    await queryRunner.query(`ALTER TABLE "AgentMessageEntity" RENAME TO "temporary_AgentMessageEntity"`)
    await queryRunner.query(`
            CREATE TABLE "AgentMessageEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "role" varchar NOT NULL,
                "content" text NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "reasoning" text,
                "parts" text
            )
        `)
    await queryRunner.query(`
            INSERT INTO "AgentMessageEntity"("id", "role", "content", "createAt", "reasoning", "parts")
            SELECT "id",
                "role",
                "content",
                "createAt",
                "reasoning",
                "parts"
            FROM "temporary_AgentMessageEntity"
        `)
    await queryRunner.query(`DROP TABLE "temporary_AgentMessageEntity"`)
    await queryRunner.query(`DROP TABLE "AgentConversationEntity"`)
  }
}

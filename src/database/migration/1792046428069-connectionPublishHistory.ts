import { MigrationInterface, QueryRunner } from 'typeorm'

// SQLite has no UUID function, so build a random v4 UUID for each copied history row.
const randomUuid = `lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + abs(random()) % 4, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))`

export class connectionPublishHistory1792046428069 implements MigrationInterface {
  name = 'connectionPublishHistory1792046428069'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adding a column keeps ConnectionEntity in place; rebuilding it would cascade-delete subscriptions and messages.
    await queryRunner.query(`
            ALTER TABLE "ConnectionEntity"
            ADD COLUMN "pushMessage" text
        `)
    // Each existing connection starts with its own copy of the previously shared history.
    await queryRunner.query(`
            CREATE TABLE "temporary_historyMessageHeaderEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "qos" varchar CHECK(qos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "connection_id" varchar NOT NULL,
                CONSTRAINT "FK_925dbbfc7e0d280a00b8fa7f14d" FOREIGN KEY ("connection_id") REFERENCES "ConnectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_historyMessageHeaderEntity"(
                    "id",
                    "retain",
                    "topic",
                    "qos",
                    "createAt",
                    "connection_id"
                )
            SELECT ${randomUuid},
                h."retain",
                h."topic",
                h."qos",
                h."createAt",
                c."id"
            FROM "historyMessageHeaderEntity" h
                CROSS JOIN "ConnectionEntity" c
        `)
    await queryRunner.query(`
            DROP TABLE "historyMessageHeaderEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_historyMessageHeaderEntity"
                RENAME TO "historyMessageHeaderEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_historyMessagePayloadEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar NOT NULL DEFAULT ('JSON'),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "connection_id" varchar NOT NULL,
                CONSTRAINT "FK_51db2b5156080e287b46520317f" FOREIGN KEY ("connection_id") REFERENCES "ConnectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_historyMessagePayloadEntity"(
                    "id",
                    "payload",
                    "payloadType",
                    "createAt",
                    "connection_id"
                )
            SELECT ${randomUuid},
                p."payload",
                p."payloadType",
                p."createAt",
                c."id"
            FROM "historyMessagePayloadEntity" p
                CROSS JOIN "ConnectionEntity" c
        `)
    await queryRunner.query(`
            DROP TABLE "historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_historyMessagePayloadEntity"
                RENAME TO "historyMessagePayloadEntity"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Merge the per-connection copies back into one shared history.
    await queryRunner.query(`
            ALTER TABLE "historyMessagePayloadEntity"
                RENAME TO "temporary_historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "historyMessagePayloadEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar NOT NULL DEFAULT ('JSON'),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            INSERT INTO "historyMessagePayloadEntity"("id", "payload", "payloadType", "createAt")
            SELECT MIN("id"),
                "payload",
                "payloadType",
                MAX("createAt")
            FROM "temporary_historyMessagePayloadEntity"
            GROUP BY "payload",
                "payloadType"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "historyMessageHeaderEntity"
                RENAME TO "temporary_historyMessageHeaderEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "historyMessageHeaderEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "qos" varchar CHECK(qos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            INSERT INTO "historyMessageHeaderEntity"("id", "retain", "topic", "qos", "createAt")
            SELECT MIN("id"),
                "retain",
                "topic",
                "qos",
                MAX("createAt")
            FROM "temporary_historyMessageHeaderEntity"
            GROUP BY "retain",
                "topic",
                "qos"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_historyMessageHeaderEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "ConnectionEntity" DROP COLUMN "pushMessage"
        `)
  }
}

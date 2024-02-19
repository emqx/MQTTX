import { MigrationInterface, QueryRunner } from 'typeorm'

export class updatePayloadTypeToVarchar1630403733965 implements MigrationInterface {
  name = 'updatePayloadTypeToVarchar1630403733965'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_historyMessagePayloadEntity" (
                "id" uuid PRIMARY KEY NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar NOT NULL DEFAULT 'JSON',
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_historyMessagePayloadEntity" ("id", "payload", "payloadType", "createAt")
            SELECT "id", "payload", "payloadType", "createAt"
            FROM "historyMessagePayloadEntity"
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
    await queryRunner.query(`
            CREATE TABLE "temporary_historyMessagePayloadEntity" (
                "id" uuid PRIMARY KEY NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar CHECK(payloadType IN ('Plaintext', 'Base64', 'JSON', 'Hex')) NOT NULL DEFAULT 'JSON',
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)

    await queryRunner.query(`
            INSERT INTO "temporary_historyMessagePayloadEntity" ("id", "payload", "payloadType", "createAt")
            SELECT "id", "payload", "payloadType", "createAt"
            FROM "historyMessagePayloadEntity"
        `)

    await queryRunner.query(`
            DROP TABLE "historyMessagePayloadEntity"
        `)

    await queryRunner.query(`
            ALTER TABLE "temporary_historyMessagePayloadEntity"
            RENAME TO "historyMessagePayloadEntity"
        `)
  }
}

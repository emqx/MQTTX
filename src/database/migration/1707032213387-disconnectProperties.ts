import { MigrationInterface, QueryRunner } from 'typeorm'

export class disconnectProperties1707032213387 implements MigrationInterface {
  name = 'disconnectProperties1707032213387'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_historyMessagePayloadEntity" (
                "id" uuid PRIMARY KEY NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar NOT NULL DEFAULT ('JSON'),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_historyMessagePayloadEntity"("id", "payload", "payloadType", "createAt")
            SELECT "id",
                "payload",
                "payloadType",
                "createAt"
            FROM "historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_historyMessagePayloadEntity"
                RENAME TO "historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "DisconnectPropertiesEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "connectionId" varchar NOT NULL,
                "sessionExpiryInterval" integer,
                "reasonString" varchar,
                "serverReference" varchar,
                "userProperties" varchar
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_historyMessagePayloadEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar NOT NULL DEFAULT ('JSON'),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_historyMessagePayloadEntity"("id", "payload", "payloadType", "createAt")
            SELECT "id",
                "payload",
                "payloadType",
                "createAt"
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
            ALTER TABLE "historyMessagePayloadEntity"
                RENAME TO "temporary_historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "historyMessagePayloadEntity" (
                "id" uuid PRIMARY KEY NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar NOT NULL DEFAULT ('JSON'),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            INSERT INTO "historyMessagePayloadEntity"("id", "payload", "payloadType", "createAt")
            SELECT "id",
                "payload",
                "payloadType",
                "createAt"
            FROM "temporary_historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "DisconnectPropertiesEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "historyMessagePayloadEntity"
                RENAME TO "temporary_historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "historyMessagePayloadEntity" (
                "id" uuid PRIMARY KEY NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar NOT NULL DEFAULT ('JSON'),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            INSERT INTO "historyMessagePayloadEntity"("id", "payload", "payloadType", "createAt")
            SELECT "id",
                "payload",
                "payloadType",
                "createAt"
            FROM "temporary_historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_historyMessagePayloadEntity"
        `)
  }
}

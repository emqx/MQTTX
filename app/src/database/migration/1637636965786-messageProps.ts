import { MigrationInterface, QueryRunner } from 'typeorm'

export class messageProps1637636965786 implements MigrationInterface {
  name = 'messageProps1637636965786'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_MessageEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "createAt" varchar NOT NULL,
                "out" boolean NOT NULL,
                "payload" varchar NOT NULL,
                "qos" varchar CHECK(qos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "connection_id" varchar,
                "payloadFormatIndicator" boolean,
                "messageExpiryInterval" integer,
                "topicAlias" integer,
                "responseTopic" varchar,
                "correlationData" varchar,
                "userProperties" varchar,
                "subscriptionIdentifier" integer,
                "contentType" varchar,
                CONSTRAINT "FK_0ec5f9ea56492cdc39eb70dafd0" FOREIGN KEY ("connection_id") REFERENCES "ConnectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_MessageEntity"(
                    "id",
                    "createAt",
                    "out",
                    "payload",
                    "qos",
                    "retain",
                    "topic",
                    "connection_id"
                )
            SELECT "id",
                "createAt",
                "out",
                "payload",
                "qos",
                "retain",
                "topic",
                "connection_id"
            FROM "MessageEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "MessageEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_MessageEntity"
                RENAME TO "MessageEntity"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "MessageEntity"
                RENAME TO "temporary_MessageEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "MessageEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "createAt" varchar NOT NULL,
                "out" boolean NOT NULL,
                "payload" varchar NOT NULL,
                "qos" varchar CHECK(qos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "connection_id" varchar,
                CONSTRAINT "FK_0ec5f9ea56492cdc39eb70dafd0" FOREIGN KEY ("connection_id") REFERENCES "ConnectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "MessageEntity"(
                    "id",
                    "createAt",
                    "out",
                    "payload",
                    "qos",
                    "retain",
                    "topic",
                    "connection_id"
                )
            SELECT "id",
                "createAt",
                "out",
                "payload",
                "qos",
                "retain",
                "topic",
                "connection_id"
            FROM "temporary_MessageEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_MessageEntity"
        `)
  }
}

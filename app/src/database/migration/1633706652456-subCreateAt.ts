import { MigrationInterface, QueryRunner } from 'typeorm'

export class subCreateAt1633706652456 implements MigrationInterface {
  name = 'subCreateAt1633706652456'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_SubscriptionEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "topic" varchar NOT NULL,
                "qos" varchar CHECK(qos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "alias" varchar,
                "retain" boolean DEFAULT (0),
                "color" varchar,
                "connection_id" varchar,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT "FK_a54c00ab3625410a83e4f160518" FOREIGN KEY ("connection_id") REFERENCES "ConnectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_SubscriptionEntity"(
                    "id",
                    "topic",
                    "qos",
                    "alias",
                    "retain",
                    "color",
                    "connection_id"
                )
            SELECT "id",
                "topic",
                "qos",
                "alias",
                "retain",
                "color",
                "connection_id"
            FROM "SubscriptionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "SubscriptionEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_SubscriptionEntity"
                RENAME TO "SubscriptionEntity"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "SubscriptionEntity"
                RENAME TO "temporary_SubscriptionEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "SubscriptionEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "topic" varchar NOT NULL,
                "qos" varchar CHECK(qos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "alias" varchar,
                "retain" boolean DEFAULT (0),
                "color" varchar,
                "connection_id" varchar,
                CONSTRAINT "FK_a54c00ab3625410a83e4f160518" FOREIGN KEY ("connection_id") REFERENCES "ConnectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "SubscriptionEntity"(
                    "id",
                    "topic",
                    "qos",
                    "alias",
                    "retain",
                    "color",
                    "connection_id"
                )
            SELECT "id",
                "topic",
                "qos",
                "alias",
                "retain",
                "color",
                "connection_id"
            FROM "temporary_SubscriptionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_SubscriptionEntity"
        `)
  }
}

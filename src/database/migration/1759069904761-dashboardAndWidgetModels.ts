import { MigrationInterface, QueryRunner } from 'typeorm'

export class dashboardAndWidgetModels1759069904761 implements MigrationInterface {
  name = 'dashboardAndWidgetModels1759069904761'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "WidgetEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "dashboard_id" varchar NOT NULL,
                "x" integer NOT NULL,
                "y" integer NOT NULL,
                "w" integer NOT NULL,
                "h" integer NOT NULL,
                "static" boolean NOT NULL DEFAULT (0),
                "minW" integer,
                "minH" integer,
                "maxW" integer,
                "maxH" integer,
                "type" varchar NOT NULL,
                "title" varchar,
                "connectionId" varchar,
                "topicPattern" varchar,
                "valueField" varchar,
                "fallbackValue" float NOT NULL DEFAULT (0),
                "schemaType" varchar CHECK(schemaType IN ('protobuf', 'avro')),
                "schemaId" varchar,
                "schemaMessageName" varchar,
                "schemaValidationState" varchar CHECK(schemaValidationState IN ('valid', 'invalid')),
                "schemaValidationError" text,
                "widgetOptions" text,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "DashboardEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar NOT NULL,
                "description" varchar,
                "orderId" integer,
                "globalSettings" text,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_WidgetEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "dashboard_id" varchar NOT NULL,
                "x" integer NOT NULL,
                "y" integer NOT NULL,
                "w" integer NOT NULL,
                "h" integer NOT NULL,
                "static" boolean NOT NULL DEFAULT (0),
                "minW" integer,
                "minH" integer,
                "maxW" integer,
                "maxH" integer,
                "type" varchar NOT NULL,
                "title" varchar,
                "connectionId" varchar,
                "topicPattern" varchar,
                "valueField" varchar,
                "fallbackValue" float NOT NULL DEFAULT (0),
                "schemaType" varchar CHECK(schemaType IN ('protobuf', 'avro')),
                "schemaId" varchar,
                "schemaMessageName" varchar,
                "schemaValidationState" varchar CHECK(schemaValidationState IN ('valid', 'invalid')),
                "schemaValidationError" text,
                "widgetOptions" text,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT "FK_0edfec3287926ebbc0a301bfd13" FOREIGN KEY ("dashboard_id") REFERENCES "DashboardEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_WidgetEntity"(
                    "id",
                    "dashboard_id",
                    "x",
                    "y",
                    "w",
                    "h",
                    "static",
                    "minW",
                    "minH",
                    "maxW",
                    "maxH",
                    "type",
                    "title",
                    "connectionId",
                    "topicPattern",
                    "valueField",
                    "fallbackValue",
                    "schemaType",
                    "schemaId",
                    "schemaMessageName",
                    "schemaValidationState",
                    "schemaValidationError",
                    "widgetOptions",
                    "createAt",
                    "updateAt"
                )
            SELECT "id",
                "dashboard_id",
                "x",
                "y",
                "w",
                "h",
                "static",
                "minW",
                "minH",
                "maxW",
                "maxH",
                "type",
                "title",
                "connectionId",
                "topicPattern",
                "valueField",
                "fallbackValue",
                "schemaType",
                "schemaId",
                "schemaMessageName",
                "schemaValidationState",
                "schemaValidationError",
                "widgetOptions",
                "createAt",
                "updateAt"
            FROM "WidgetEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "WidgetEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_WidgetEntity"
                RENAME TO "WidgetEntity"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "WidgetEntity"
                RENAME TO "temporary_WidgetEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "WidgetEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "dashboard_id" varchar NOT NULL,
                "x" integer NOT NULL,
                "y" integer NOT NULL,
                "w" integer NOT NULL,
                "h" integer NOT NULL,
                "static" boolean NOT NULL DEFAULT (0),
                "minW" integer,
                "minH" integer,
                "maxW" integer,
                "maxH" integer,
                "type" varchar NOT NULL,
                "title" varchar,
                "connectionId" varchar,
                "topicPattern" varchar,
                "valueField" varchar,
                "fallbackValue" float NOT NULL DEFAULT (0),
                "schemaType" varchar CHECK(schemaType IN ('protobuf', 'avro')),
                "schemaId" varchar,
                "schemaMessageName" varchar,
                "schemaValidationState" varchar CHECK(schemaValidationState IN ('valid', 'invalid')),
                "schemaValidationError" text,
                "widgetOptions" text,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            INSERT INTO "WidgetEntity"(
                    "id",
                    "dashboard_id",
                    "x",
                    "y",
                    "w",
                    "h",
                    "static",
                    "minW",
                    "minH",
                    "maxW",
                    "maxH",
                    "type",
                    "title",
                    "connectionId",
                    "topicPattern",
                    "valueField",
                    "fallbackValue",
                    "schemaType",
                    "schemaId",
                    "schemaMessageName",
                    "schemaValidationState",
                    "schemaValidationError",
                    "widgetOptions",
                    "createAt",
                    "updateAt"
                )
            SELECT "id",
                "dashboard_id",
                "x",
                "y",
                "w",
                "h",
                "static",
                "minW",
                "minH",
                "maxW",
                "maxH",
                "type",
                "title",
                "connectionId",
                "topicPattern",
                "valueField",
                "fallbackValue",
                "schemaType",
                "schemaId",
                "schemaMessageName",
                "schemaValidationState",
                "schemaValidationError",
                "widgetOptions",
                "createAt",
                "updateAt"
            FROM "temporary_WidgetEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_WidgetEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "DashboardEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "WidgetEntity"
        `)
  }
}

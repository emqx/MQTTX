import { MigrationInterface, QueryRunner } from 'typeorm'

export class supportOpenAIAPIHost1716044120271 implements MigrationInterface {
  name = 'supportOpenAIAPIHost1716044120271'

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
            CREATE TABLE "temporary_SettingEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "width" integer NOT NULL DEFAULT (1025),
                "height" integer NOT NULL DEFAULT (749),
                "autoCheck" boolean NOT NULL DEFAULT (1),
                "currentLang" varchar CHECK(currentLang IN ('zh', 'en', 'ja', 'tr', 'hu')) NOT NULL DEFAULT ('en'),
                "currentTheme" varchar CHECK(currentTheme IN ('light', 'dark', 'night')) NOT NULL DEFAULT ('light'),
                "maxReconnectTimes" integer NOT NULL DEFAULT (10),
                "autoResub" boolean NOT NULL DEFAULT (1),
                "syncOsTheme" boolean NOT NULL DEFAULT (0),
                "multiTopics" boolean NOT NULL DEFAULT (1),
                "jsonHighlight" boolean NOT NULL DEFAULT (1),
                "openAIAPIKey" varchar NOT NULL DEFAULT (''),
                "model" varchar NOT NULL DEFAULT ('gpt-3.5-turbo'),
                "enableCopilot" boolean NOT NULL DEFAULT (1),
                "logLevel" varchar CHECK(logLevel IN ('debug', 'info', 'warn', 'error')) NOT NULL DEFAULT ('info'),
                "openAIAPIHost" varchar NOT NULL DEFAULT ('https://api.openai.com/v1')
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_SettingEntity"(
                    "id",
                    "width",
                    "height",
                    "autoCheck",
                    "currentLang",
                    "currentTheme",
                    "maxReconnectTimes",
                    "autoResub",
                    "syncOsTheme",
                    "multiTopics",
                    "jsonHighlight",
                    "openAIAPIKey",
                    "model",
                    "enableCopilot",
                    "logLevel"
                )
            SELECT "id",
                "width",
                "height",
                "autoCheck",
                "currentLang",
                "currentTheme",
                "maxReconnectTimes",
                "autoResub",
                "syncOsTheme",
                "multiTopics",
                "jsonHighlight",
                "openAIAPIKey",
                "model",
                "enableCopilot",
                "logLevel"
            FROM "SettingEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "SettingEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_SettingEntity"
                RENAME TO "SettingEntity"
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
            ALTER TABLE "SettingEntity"
                RENAME TO "temporary_SettingEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "SettingEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "width" integer NOT NULL DEFAULT (1025),
                "height" integer NOT NULL DEFAULT (749),
                "autoCheck" boolean NOT NULL DEFAULT (1),
                "currentLang" varchar CHECK(currentLang IN ('zh', 'en', 'ja', 'tr', 'hu')) NOT NULL DEFAULT ('en'),
                "currentTheme" varchar CHECK(currentTheme IN ('light', 'dark', 'night')) NOT NULL DEFAULT ('light'),
                "maxReconnectTimes" integer NOT NULL DEFAULT (10),
                "autoResub" boolean NOT NULL DEFAULT (1),
                "syncOsTheme" boolean NOT NULL DEFAULT (0),
                "multiTopics" boolean NOT NULL DEFAULT (1),
                "jsonHighlight" boolean NOT NULL DEFAULT (1),
                "openAIAPIKey" varchar NOT NULL DEFAULT (''),
                "model" varchar NOT NULL DEFAULT ('gpt-3.5-turbo'),
                "enableCopilot" boolean NOT NULL DEFAULT (1),
                "logLevel" varchar CHECK(logLevel IN ('debug', 'info', 'warn', 'error')) NOT NULL DEFAULT ('info')
            )
        `)
    await queryRunner.query(`
            INSERT INTO "SettingEntity"(
                    "id",
                    "width",
                    "height",
                    "autoCheck",
                    "currentLang",
                    "currentTheme",
                    "maxReconnectTimes",
                    "autoResub",
                    "syncOsTheme",
                    "multiTopics",
                    "jsonHighlight",
                    "openAIAPIKey",
                    "model",
                    "enableCopilot",
                    "logLevel"
                )
            SELECT "id",
                "width",
                "height",
                "autoCheck",
                "currentLang",
                "currentTheme",
                "maxReconnectTimes",
                "autoResub",
                "syncOsTheme",
                "multiTopics",
                "jsonHighlight",
                "openAIAPIKey",
                "model",
                "enableCopilot",
                "logLevel"
            FROM "temporary_SettingEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_SettingEntity"
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

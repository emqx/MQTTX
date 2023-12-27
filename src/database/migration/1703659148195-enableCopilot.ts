import { MigrationInterface, QueryRunner } from 'typeorm'

export class enableCopilot1703659148195 implements MigrationInterface {
  name = 'enableCopilot1703659148195'

  public async up(queryRunner: QueryRunner): Promise<void> {
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
                "enableCopilot" boolean NOT NULL DEFAULT (1)
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
                    "model"
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
                "model"
            FROM "SettingEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "SettingEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_SettingEntity"
                RENAME TO "SettingEntity"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
                "model" varchar NOT NULL DEFAULT ('gpt-3.5-turbo')
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
                    "model"
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
                "model"
            FROM "temporary_SettingEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_SettingEntity"
        `)
  }
}

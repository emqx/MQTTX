import { MigrationInterface, QueryRunner } from 'typeorm'

export class huLang1635392304194 implements MigrationInterface {
  name = 'huLang1635392304194'

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
            "autoScroll" boolean NOT NULL DEFAULT (1)
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
                "autoScroll"
            )
        SELECT "id",
            "width",
            "height",
            "autoCheck",
            "currentLang",
            "currentTheme",
            "maxReconnectTimes",
            "autoResub",
            "autoScroll"
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
                "currentLang" varchar CHECK(currentLang IN ('zh', 'en', 'ja', 'tr')) NOT NULL DEFAULT ('en'),
                "currentTheme" varchar CHECK(currentTheme IN ('light', 'dark', 'night')) NOT NULL DEFAULT ('light'),
                "maxReconnectTimes" integer NOT NULL DEFAULT (10),
                "autoResub" boolean NOT NULL DEFAULT (1),
                "autoScroll" boolean NOT NULL DEFAULT (1)
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
                "autoScroll"
                )
            SELECT "id",
                "width",
                "height",
                "autoCheck",
                "currentLang",
                "currentTheme",
                "maxReconnectTimes",
                "autoResub",
                "autoScroll"
            FROM "temporary_SettingEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_SettingEntity"
        `)
  }
}

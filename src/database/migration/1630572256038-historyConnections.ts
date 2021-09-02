import { MigrationInterface, QueryRunner } from 'typeorm'

export class historyConnections1630572256038 implements MigrationInterface {
  name = 'historyConnections1630572256038'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "HistoryConnectionEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "client_id" varchar NOT NULL,
                "name" varchar NOT NULL,
                "clean" boolean NOT NULL DEFAULT (1),
                "protocol" varchar CHECK(protocol IN ('ws', 'wss', 'mqtt', 'mqtts')) NOT NULL DEFAULT ('mqtt'),
                "host" varchar NOT NULL,
                "port" integer NOT NULL,
                "keepalive" integer NOT NULL DEFAULT (60),
                "connectTimeout" integer NOT NULL,
                "reconnect" boolean NOT NULL,
                "username" varchar,
                "password" varchar,
                "path" varchar,
                "certType" varchar CHECK(certType IN ('', 'server', 'self')) DEFAULT (''),
                "ssl" boolean NOT NULL,
                "mqttVersion" varchar NOT NULL,
                "unreadMessageCount" integer NOT NULL,
                "clientIdWithTime" boolean DEFAULT (0),
                "orderId" integer,
                "rejectUnauthorized" boolean DEFAULT (1),
                "ca" varchar NOT NULL,
                "cert" varchar NOT NULL,
                "key" varchar NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "willId" varchar,
                CONSTRAINT "REL_f2f18c74e1ef1d952e3fc7fda3" UNIQUE ("willId")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_SettingEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "width" integer NOT NULL DEFAULT (1025),
                "height" integer NOT NULL DEFAULT (749),
                "autoCheck" boolean NOT NULL DEFAULT (1),
                "currentLang" varchar CHECK(currentLang IN ('zh', 'en', 'ja', 'tr')) NOT NULL DEFAULT ('en'),
                "currentTheme" varchar CHECK(currentTheme IN ('light', 'dark', 'night')) NOT NULL DEFAULT ('light'),
                "maxReconnectTimes" integer NOT NULL DEFAULT (10),
                "autoResub" boolean NOT NULL DEFAULT (1)
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
                    "autoResub"
                )
            SELECT "id",
                "width",
                "height",
                "autoCheck",
                "currentLang",
                "currentTheme",
                "maxReconnectTimes",
                "autoResub"
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
            CREATE TABLE "temporary_HistoryConnectionEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "client_id" varchar NOT NULL,
                "name" varchar NOT NULL,
                "clean" boolean NOT NULL DEFAULT (1),
                "protocol" varchar CHECK(protocol IN ('ws', 'wss', 'mqtt', 'mqtts')) NOT NULL DEFAULT ('mqtt'),
                "host" varchar NOT NULL,
                "port" integer NOT NULL,
                "keepalive" integer NOT NULL DEFAULT (60),
                "connectTimeout" integer NOT NULL,
                "reconnect" boolean NOT NULL,
                "username" varchar,
                "password" varchar,
                "path" varchar,
                "certType" varchar CHECK(certType IN ('', 'server', 'self')) DEFAULT (''),
                "ssl" boolean NOT NULL,
                "mqttVersion" varchar NOT NULL,
                "unreadMessageCount" integer NOT NULL,
                "clientIdWithTime" boolean DEFAULT (0),
                "orderId" integer,
                "rejectUnauthorized" boolean DEFAULT (1),
                "ca" varchar NOT NULL,
                "cert" varchar NOT NULL,
                "key" varchar NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "willId" varchar,
                CONSTRAINT "REL_f2f18c74e1ef1d952e3fc7fda3" UNIQUE ("willId"),
                CONSTRAINT "FK_f2f18c74e1ef1d952e3fc7fda32" FOREIGN KEY ("willId") REFERENCES "WillEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_HistoryConnectionEntity"(
                    "id",
                    "client_id",
                    "name",
                    "clean",
                    "protocol",
                    "host",
                    "port",
                    "keepalive",
                    "connectTimeout",
                    "reconnect",
                    "username",
                    "password",
                    "path",
                    "certType",
                    "ssl",
                    "mqttVersion",
                    "unreadMessageCount",
                    "clientIdWithTime",
                    "orderId",
                    "rejectUnauthorized",
                    "ca",
                    "cert",
                    "key",
                    "createAt",
                    "updateAt",
                    "willId"
                )
            SELECT "id",
                "client_id",
                "name",
                "clean",
                "protocol",
                "host",
                "port",
                "keepalive",
                "connectTimeout",
                "reconnect",
                "username",
                "password",
                "path",
                "certType",
                "ssl",
                "mqttVersion",
                "unreadMessageCount",
                "clientIdWithTime",
                "orderId",
                "rejectUnauthorized",
                "ca",
                "cert",
                "key",
                "createAt",
                "updateAt",
                "willId"
            FROM "HistoryConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "HistoryConnectionEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_HistoryConnectionEntity"
                RENAME TO "HistoryConnectionEntity"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "HistoryConnectionEntity"
                RENAME TO "temporary_HistoryConnectionEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "HistoryConnectionEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "client_id" varchar NOT NULL,
                "name" varchar NOT NULL,
                "clean" boolean NOT NULL DEFAULT (1),
                "protocol" varchar CHECK(protocol IN ('ws', 'wss', 'mqtt', 'mqtts')) NOT NULL DEFAULT ('mqtt'),
                "host" varchar NOT NULL,
                "port" integer NOT NULL,
                "keepalive" integer NOT NULL DEFAULT (60),
                "connectTimeout" integer NOT NULL,
                "reconnect" boolean NOT NULL,
                "username" varchar,
                "password" varchar,
                "path" varchar,
                "certType" varchar CHECK(certType IN ('', 'server', 'self')) DEFAULT (''),
                "ssl" boolean NOT NULL,
                "mqttVersion" varchar NOT NULL,
                "unreadMessageCount" integer NOT NULL,
                "clientIdWithTime" boolean DEFAULT (0),
                "orderId" integer,
                "rejectUnauthorized" boolean DEFAULT (1),
                "ca" varchar NOT NULL,
                "cert" varchar NOT NULL,
                "key" varchar NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "willId" varchar,
                CONSTRAINT "REL_f2f18c74e1ef1d952e3fc7fda3" UNIQUE ("willId")
            )
        `)
    await queryRunner.query(`
            INSERT INTO "HistoryConnectionEntity"(
                    "id",
                    "client_id",
                    "name",
                    "clean",
                    "protocol",
                    "host",
                    "port",
                    "keepalive",
                    "connectTimeout",
                    "reconnect",
                    "username",
                    "password",
                    "path",
                    "certType",
                    "ssl",
                    "mqttVersion",
                    "unreadMessageCount",
                    "clientIdWithTime",
                    "orderId",
                    "rejectUnauthorized",
                    "ca",
                    "cert",
                    "key",
                    "createAt",
                    "updateAt",
                    "willId"
                )
            SELECT "id",
                "client_id",
                "name",
                "clean",
                "protocol",
                "host",
                "port",
                "keepalive",
                "connectTimeout",
                "reconnect",
                "username",
                "password",
                "path",
                "certType",
                "ssl",
                "mqttVersion",
                "unreadMessageCount",
                "clientIdWithTime",
                "orderId",
                "rejectUnauthorized",
                "ca",
                "cert",
                "key",
                "createAt",
                "updateAt",
                "willId"
            FROM "temporary_HistoryConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_HistoryConnectionEntity"
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
                "currentLang" varchar CHECK(currentLang IN ('zh', 'en', 'ja', 'tr')) NOT NULL DEFAULT ('en'),
                "currentTheme" varchar CHECK(currentTheme IN ('light', 'dark', 'night')) NOT NULL DEFAULT ('light'),
                "maxReconnectTimes" integer NOT NULL DEFAULT (10),
                "autoResub" boolean NOT NULL DEFAULT (1),
                "cleanAt" datetime
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
                    "autoResub"
                )
            SELECT "id",
                "width",
                "height",
                "autoCheck",
                "currentLang",
                "currentTheme",
                "maxReconnectTimes",
                "autoResub"
            FROM "temporary_SettingEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_SettingEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "HistoryConnectionEntity"
        `)
  }
}

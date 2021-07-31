import { MigrationInterface, QueryRunner } from 'typeorm'

export class initTable1627697951611 implements MigrationInterface {
  name = 'initTable1627697951611'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "MessageEntity" (
                "mid" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "createAt" datetime NOT NULL,
                "out" boolean NOT NULL,
                "payload" varchar NOT NULL,
                "qos" integer NOT NULL,
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "connectionId" integer
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "SubscriptionEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "topic" varchar NOT NULL,
                "qos" integer NOT NULL,
                "alias" varchar NOT NULL,
                "retain" boolean NOT NULL,
                "color" varchar NOT NULL,
                "connectionId" integer
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "CollectionEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar NOT NULL,
                "orderId" integer NOT NULL
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "WillEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "lastWillTopic" varchar NOT NULL,
                "lastWillPayload" varchar NOT NULL,
                "lastWillQos" integer NOT NULL,
                "lastWillRetain" boolean NOT NULL,
                "willDelayInterval" integer NOT NULL,
                "payloadFormatIndicator" boolean NOT NULL,
                "messageExpiryInterval" integer NOT NULL,
                "contentType" varchar NOT NULL
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "ConnectionEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "clientId" varchar NOT NULL,
                "name" varchar NOT NULL,
                "clean" boolean NOT NULL DEFAULT (1),
                "protocol" varchar NOT NULL,
                "host" varchar NOT NULL,
                "port" integer NOT NULL,
                "keepalive" integer NOT NULL DEFAULT (60),
                "connectTimeout" integer NOT NULL,
                "reconnect" boolean NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "path" varchar NOT NULL,
                "certType" varchar NOT NULL,
                "ssl" boolean NOT NULL,
                "mqttVersion" varchar NOT NULL,
                "unreadMessageCount" integer NOT NULL,
                "clientIdWithTime" boolean NOT NULL,
                "orderId" integer NOT NULL,
                "rejectUnauthorized" boolean NOT NULL,
                "ca" varchar NOT NULL,
                "cert" varchar NOT NULL,
                "key" varchar NOT NULL,
                "createAt" datetime NOT NULL,
                "updateAt" datetime NOT NULL,
                "collectionId" integer,
                "willId" integer,
                CONSTRAINT "REL_71db93dbf719b8b12e835e343f" UNIQUE ("willId")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "ScriptEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "script" varchar NOT NULL
            )
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
                "autoResub" boolean NOT NULL DEFAULT (1)
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "historyMessageHeaderEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "qos" integer NOT NULL
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "historyMessagePayloadEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar NOT NULL
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_MessageEntity" (
                "mid" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "createAt" datetime NOT NULL,
                "out" boolean NOT NULL,
                "payload" varchar NOT NULL,
                "qos" integer NOT NULL,
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "connectionId" integer,
                CONSTRAINT "FK_6479a55a5ff49de9e6e4f0e0589" FOREIGN KEY ("connectionId") REFERENCES "ConnectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_MessageEntity"(
                    "mid",
                    "createAt",
                    "out",
                    "payload",
                    "qos",
                    "retain",
                    "topic",
                    "connectionId"
                )
            SELECT "mid",
                "createAt",
                "out",
                "payload",
                "qos",
                "retain",
                "topic",
                "connectionId"
            FROM "MessageEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "MessageEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_MessageEntity"
                RENAME TO "MessageEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_SubscriptionEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "topic" varchar NOT NULL,
                "qos" integer NOT NULL,
                "alias" varchar NOT NULL,
                "retain" boolean NOT NULL,
                "color" varchar NOT NULL,
                "connectionId" integer,
                CONSTRAINT "FK_138789f07246e8e75acc1677054" FOREIGN KEY ("connectionId") REFERENCES "ConnectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                    "connectionId"
                )
            SELECT "id",
                "topic",
                "qos",
                "alias",
                "retain",
                "color",
                "connectionId"
            FROM "SubscriptionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "SubscriptionEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_SubscriptionEntity"
                RENAME TO "SubscriptionEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_ConnectionEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "clientId" varchar NOT NULL,
                "name" varchar NOT NULL,
                "clean" boolean NOT NULL DEFAULT (1),
                "protocol" varchar NOT NULL,
                "host" varchar NOT NULL,
                "port" integer NOT NULL,
                "keepalive" integer NOT NULL DEFAULT (60),
                "connectTimeout" integer NOT NULL,
                "reconnect" boolean NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "path" varchar NOT NULL,
                "certType" varchar NOT NULL,
                "ssl" boolean NOT NULL,
                "mqttVersion" varchar NOT NULL,
                "unreadMessageCount" integer NOT NULL,
                "clientIdWithTime" boolean NOT NULL,
                "orderId" integer NOT NULL,
                "rejectUnauthorized" boolean NOT NULL,
                "ca" varchar NOT NULL,
                "cert" varchar NOT NULL,
                "key" varchar NOT NULL,
                "createAt" datetime NOT NULL,
                "updateAt" datetime NOT NULL,
                "collectionId" integer,
                "willId" integer,
                CONSTRAINT "REL_71db93dbf719b8b12e835e343f" UNIQUE ("willId"),
                CONSTRAINT "FK_c01153ea690e49bbd4d893c62cf" FOREIGN KEY ("collectionId") REFERENCES "CollectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_71db93dbf719b8b12e835e343fe" FOREIGN KEY ("willId") REFERENCES "WillEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_ConnectionEntity"(
                    "id",
                    "clientId",
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
                    "collectionId",
                    "willId"
                )
            SELECT "id",
                "clientId",
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
                "collectionId",
                "willId"
            FROM "ConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "ConnectionEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_ConnectionEntity"
                RENAME TO "ConnectionEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "query-result-cache" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "identifier" varchar,
                "time" bigint NOT NULL,
                "duration" integer NOT NULL,
                "query" text NOT NULL,
                "result" text NOT NULL
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "query-result-cache"
        `)
    await queryRunner.query(`
            ALTER TABLE "ConnectionEntity"
                RENAME TO "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "ConnectionEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "clientId" varchar NOT NULL,
                "name" varchar NOT NULL,
                "clean" boolean NOT NULL DEFAULT (1),
                "protocol" varchar NOT NULL,
                "host" varchar NOT NULL,
                "port" integer NOT NULL,
                "keepalive" integer NOT NULL DEFAULT (60),
                "connectTimeout" integer NOT NULL,
                "reconnect" boolean NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "path" varchar NOT NULL,
                "certType" varchar NOT NULL,
                "ssl" boolean NOT NULL,
                "mqttVersion" varchar NOT NULL,
                "unreadMessageCount" integer NOT NULL,
                "clientIdWithTime" boolean NOT NULL,
                "orderId" integer NOT NULL,
                "rejectUnauthorized" boolean NOT NULL,
                "ca" varchar NOT NULL,
                "cert" varchar NOT NULL,
                "key" varchar NOT NULL,
                "createAt" datetime NOT NULL,
                "updateAt" datetime NOT NULL,
                "collectionId" integer,
                "willId" integer,
                CONSTRAINT "REL_71db93dbf719b8b12e835e343f" UNIQUE ("willId")
            )
        `)
    await queryRunner.query(`
            INSERT INTO "ConnectionEntity"(
                    "id",
                    "clientId",
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
                    "collectionId",
                    "willId"
                )
            SELECT "id",
                "clientId",
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
                "collectionId",
                "willId"
            FROM "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "SubscriptionEntity"
                RENAME TO "temporary_SubscriptionEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "SubscriptionEntity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "topic" varchar NOT NULL,
                "qos" integer NOT NULL,
                "alias" varchar NOT NULL,
                "retain" boolean NOT NULL,
                "color" varchar NOT NULL,
                "connectionId" integer
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
                    "connectionId"
                )
            SELECT "id",
                "topic",
                "qos",
                "alias",
                "retain",
                "color",
                "connectionId"
            FROM "temporary_SubscriptionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_SubscriptionEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "MessageEntity"
                RENAME TO "temporary_MessageEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "MessageEntity" (
                "mid" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "createAt" datetime NOT NULL,
                "out" boolean NOT NULL,
                "payload" varchar NOT NULL,
                "qos" integer NOT NULL,
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "connectionId" integer
            )
        `)
    await queryRunner.query(`
            INSERT INTO "MessageEntity"(
                    "mid",
                    "createAt",
                    "out",
                    "payload",
                    "qos",
                    "retain",
                    "topic",
                    "connectionId"
                )
            SELECT "mid",
                "createAt",
                "out",
                "payload",
                "qos",
                "retain",
                "topic",
                "connectionId"
            FROM "temporary_MessageEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_MessageEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "historyMessagePayloadEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "historyMessageHeaderEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "SettingEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "ScriptEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "ConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "WillEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "CollectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "SubscriptionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "MessageEntity"
        `)
  }
}

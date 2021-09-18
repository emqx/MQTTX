import { MigrationInterface, QueryRunner } from 'typeorm'

export class suggestionConnection1631953873460 implements MigrationInterface {
  name = 'suggestionConnection1631953873460'

  public async up(queryRunner: QueryRunner): Promise<void> {
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
                "certType" varchar DEFAULT (''),
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
                "certType" varchar DEFAULT (''),
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
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
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
                    "updateAt"
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
                "updateAt"
            FROM "HistoryConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "HistoryConnectionEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_HistoryConnectionEntity"
                RENAME TO "HistoryConnectionEntity"
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
                "certType" varchar DEFAULT (''),
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
                "lastWillTopic" varchar NOT NULL DEFAULT (''),
                "lastWillPayload" varchar NOT NULL DEFAULT (''),
                "lastWillQos" varchar CHECK(lastWillQos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "lastWillRetain" boolean NOT NULL DEFAULT (0),
                "willDelayInterval" integer,
                "payloadFormatIndicator" boolean,
                "messageExpiryInterval" integer,
                "contentType" varchar DEFAULT ('')
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
                    "updateAt"
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
                "updateAt"
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
                "certType" varchar DEFAULT (''),
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
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
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
                    "updateAt"
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
                "updateAt"
            FROM "temporary_HistoryConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_HistoryConnectionEntity"
        `)
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
                "certType" varchar DEFAULT (''),
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
                    "updateAt"
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
                "updateAt"
            FROM "temporary_HistoryConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_HistoryConnectionEntity"
        `)
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
                "certType" varchar DEFAULT (''),
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
  }
}

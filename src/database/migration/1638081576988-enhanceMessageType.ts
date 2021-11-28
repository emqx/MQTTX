import { MigrationInterface, QueryRunner } from 'typeorm'

export class enhanceMessageType1638081576988 implements MigrationInterface {
  name = 'enhanceMessageType1638081576988'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_WillEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "lastWillTopic" varchar NOT NULL DEFAULT (''),
                "lastWillPayload" varchar NOT NULL DEFAULT (''),
                "lastWillQos" varchar CHECK(lastWillQos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "lastWillRetain" boolean NOT NULL DEFAULT (0),
                "willDelayInterval" integer,
                "payloadFormatIndicator" boolean,
                "messageExpiryInterval" integer,
                "contentType" varchar,
                "responseTopic" varchar,
                "correlationData" blob,
                "userProperties" varchar
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_WillEntity"(
                    "id",
                    "lastWillTopic",
                    "lastWillPayload",
                    "lastWillQos",
                    "lastWillRetain",
                    "willDelayInterval",
                    "payloadFormatIndicator",
                    "messageExpiryInterval",
                    "contentType",
                    "responseTopic",
                    "correlationData",
                    "userProperties"
                )
            SELECT "id",
                "lastWillTopic",
                "lastWillPayload",
                "lastWillQos",
                "lastWillRetain",
                "willDelayInterval",
                "payloadFormatIndicator",
                "messageExpiryInterval",
                "contentType",
                "responseTopic",
                "correlationData",
                "userProperties"
            FROM "WillEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "WillEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_WillEntity"
                RENAME TO "WillEntity"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_6fcc95296b7ab85477d47b698f"
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_ConnectionEntity" (
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
                "parent_id" varchar,
                "orderId" integer,
                "rejectUnauthorized" boolean DEFAULT (1),
                "ca" varchar NOT NULL,
                "cert" varchar NOT NULL,
                "key" varchar NOT NULL,
                "isCollection" boolean NOT NULL DEFAULT (0),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "willId" varchar,
                "sessionExpiryInterval" integer,
                "receiveMaximum" integer,
                "maximumPacketSize" integer,
                "topicAliasMaximum" integer,
                "requestResponseInformation" boolean,
                "requestProblemInformation" boolean,
                "userProperties" varchar,
                "authenticationMethod" varchar,
                "authenticationData" blob,
                CONSTRAINT "REL_71db93dbf719b8b12e835e343f" UNIQUE ("willId"),
                CONSTRAINT "FK_9beef409e9fbe4bd50dd024bac4" FOREIGN KEY ("parent_id") REFERENCES "CollectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_71db93dbf719b8b12e835e343fe" FOREIGN KEY ("willId") REFERENCES "WillEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_ConnectionEntity"(
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
                    "parent_id",
                    "orderId",
                    "rejectUnauthorized",
                    "ca",
                    "cert",
                    "key",
                    "isCollection",
                    "createAt",
                    "updateAt",
                    "willId",
                    "sessionExpiryInterval",
                    "receiveMaximum",
                    "maximumPacketSize",
                    "topicAliasMaximum",
                    "requestResponseInformation",
                    "requestProblemInformation",
                    "userProperties",
                    "authenticationMethod",
                    "authenticationData"
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
                "parent_id",
                "orderId",
                "rejectUnauthorized",
                "ca",
                "cert",
                "key",
                "isCollection",
                "createAt",
                "updateAt",
                "willId",
                "sessionExpiryInterval",
                "receiveMaximum",
                "maximumPacketSize",
                "topicAliasMaximum",
                "requestResponseInformation",
                "requestProblemInformation",
                "userProperties",
                "authenticationMethod",
                "authenticationData"
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
            CREATE UNIQUE INDEX "IDX_6fcc95296b7ab85477d47b698f" ON "ConnectionEntity" ("client_id")
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_WillEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "lastWillTopic" varchar NOT NULL DEFAULT (''),
                "lastWillPayload" varchar NOT NULL DEFAULT (''),
                "lastWillQos" varchar CHECK(lastWillQos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "lastWillRetain" boolean NOT NULL DEFAULT (0),
                "willDelayInterval" integer,
                "payloadFormatIndicator" boolean,
                "messageExpiryInterval" integer,
                "contentType" varchar,
                "responseTopic" varchar,
                "correlationData" varchar,
                "userProperties" varchar
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_WillEntity"(
                    "id",
                    "lastWillTopic",
                    "lastWillPayload",
                    "lastWillQos",
                    "lastWillRetain",
                    "willDelayInterval",
                    "payloadFormatIndicator",
                    "messageExpiryInterval",
                    "contentType",
                    "responseTopic",
                    "correlationData",
                    "userProperties"
                )
            SELECT "id",
                "lastWillTopic",
                "lastWillPayload",
                "lastWillQos",
                "lastWillRetain",
                "willDelayInterval",
                "payloadFormatIndicator",
                "messageExpiryInterval",
                "contentType",
                "responseTopic",
                "correlationData",
                "userProperties"
            FROM "WillEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "WillEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_WillEntity"
                RENAME TO "WillEntity"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_6fcc95296b7ab85477d47b698f"
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_ConnectionEntity" (
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
                "parent_id" varchar,
                "orderId" integer,
                "rejectUnauthorized" boolean DEFAULT (1),
                "ca" varchar NOT NULL,
                "cert" varchar NOT NULL,
                "key" varchar NOT NULL,
                "isCollection" boolean NOT NULL DEFAULT (0),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "willId" varchar,
                "sessionExpiryInterval" integer,
                "receiveMaximum" integer,
                "maximumPacketSize" integer,
                "topicAliasMaximum" integer,
                "requestResponseInformation" boolean,
                "requestProblemInformation" boolean,
                "userProperties" varchar,
                "authenticationMethod" varchar,
                "authenticationData" varchar,
                CONSTRAINT "REL_71db93dbf719b8b12e835e343f" UNIQUE ("willId"),
                CONSTRAINT "FK_9beef409e9fbe4bd50dd024bac4" FOREIGN KEY ("parent_id") REFERENCES "CollectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_71db93dbf719b8b12e835e343fe" FOREIGN KEY ("willId") REFERENCES "WillEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_ConnectionEntity"(
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
                    "parent_id",
                    "orderId",
                    "rejectUnauthorized",
                    "ca",
                    "cert",
                    "key",
                    "isCollection",
                    "createAt",
                    "updateAt",
                    "willId",
                    "sessionExpiryInterval",
                    "receiveMaximum",
                    "maximumPacketSize",
                    "topicAliasMaximum",
                    "requestResponseInformation",
                    "requestProblemInformation",
                    "userProperties",
                    "authenticationMethod",
                    "authenticationData"
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
                "parent_id",
                "orderId",
                "rejectUnauthorized",
                "ca",
                "cert",
                "key",
                "isCollection",
                "createAt",
                "updateAt",
                "willId",
                "sessionExpiryInterval",
                "receiveMaximum",
                "maximumPacketSize",
                "topicAliasMaximum",
                "requestResponseInformation",
                "requestProblemInformation",
                "userProperties",
                "authenticationMethod",
                "authenticationData"
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
            CREATE UNIQUE INDEX "IDX_6fcc95296b7ab85477d47b698f" ON "ConnectionEntity" ("client_id")
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_6fcc95296b7ab85477d47b698f"
        `)
    await queryRunner.query(`
            ALTER TABLE "ConnectionEntity"
                RENAME TO "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "ConnectionEntity" (
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
                "parent_id" varchar,
                "orderId" integer,
                "rejectUnauthorized" boolean DEFAULT (1),
                "ca" varchar NOT NULL,
                "cert" varchar NOT NULL,
                "key" varchar NOT NULL,
                "isCollection" boolean NOT NULL DEFAULT (0),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "willId" varchar,
                "sessionExpiryInterval" integer,
                "receiveMaximum" integer,
                "maximumPacketSize" integer,
                "topicAliasMaximum" integer,
                "requestResponseInformation" boolean,
                "requestProblemInformation" boolean,
                "userProperties" varchar,
                "authenticationMethod" varchar,
                "authenticationData" blob,
                CONSTRAINT "REL_71db93dbf719b8b12e835e343f" UNIQUE ("willId"),
                CONSTRAINT "FK_9beef409e9fbe4bd50dd024bac4" FOREIGN KEY ("parent_id") REFERENCES "CollectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_71db93dbf719b8b12e835e343fe" FOREIGN KEY ("willId") REFERENCES "WillEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "ConnectionEntity"(
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
                    "parent_id",
                    "orderId",
                    "rejectUnauthorized",
                    "ca",
                    "cert",
                    "key",
                    "isCollection",
                    "createAt",
                    "updateAt",
                    "willId",
                    "sessionExpiryInterval",
                    "receiveMaximum",
                    "maximumPacketSize",
                    "topicAliasMaximum",
                    "requestResponseInformation",
                    "requestProblemInformation",
                    "userProperties",
                    "authenticationMethod",
                    "authenticationData"
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
                "parent_id",
                "orderId",
                "rejectUnauthorized",
                "ca",
                "cert",
                "key",
                "isCollection",
                "createAt",
                "updateAt",
                "willId",
                "sessionExpiryInterval",
                "receiveMaximum",
                "maximumPacketSize",
                "topicAliasMaximum",
                "requestResponseInformation",
                "requestProblemInformation",
                "userProperties",
                "authenticationMethod",
                "authenticationData"
            FROM "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6fcc95296b7ab85477d47b698f" ON "ConnectionEntity" ("client_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "WillEntity"
                RENAME TO "temporary_WillEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "WillEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "lastWillTopic" varchar NOT NULL DEFAULT (''),
                "lastWillPayload" varchar NOT NULL DEFAULT (''),
                "lastWillQos" varchar CHECK(lastWillQos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "lastWillRetain" boolean NOT NULL DEFAULT (0),
                "willDelayInterval" integer,
                "payloadFormatIndicator" boolean,
                "messageExpiryInterval" integer,
                "contentType" varchar,
                "responseTopic" varchar,
                "correlationData" blob,
                "userProperties" varchar
            )
        `)
    await queryRunner.query(`
            INSERT INTO "WillEntity"(
                    "id",
                    "lastWillTopic",
                    "lastWillPayload",
                    "lastWillQos",
                    "lastWillRetain",
                    "willDelayInterval",
                    "payloadFormatIndicator",
                    "messageExpiryInterval",
                    "contentType",
                    "responseTopic",
                    "correlationData",
                    "userProperties"
                )
            SELECT "id",
                "lastWillTopic",
                "lastWillPayload",
                "lastWillQos",
                "lastWillRetain",
                "willDelayInterval",
                "payloadFormatIndicator",
                "messageExpiryInterval",
                "contentType",
                "responseTopic",
                "correlationData",
                "userProperties"
            FROM "temporary_WillEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_WillEntity"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_6fcc95296b7ab85477d47b698f"
        `)
    await queryRunner.query(`
            ALTER TABLE "ConnectionEntity"
                RENAME TO "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "ConnectionEntity" (
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
                "parent_id" varchar,
                "orderId" integer,
                "rejectUnauthorized" boolean DEFAULT (1),
                "ca" varchar NOT NULL,
                "cert" varchar NOT NULL,
                "key" varchar NOT NULL,
                "isCollection" boolean NOT NULL DEFAULT (0),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updateAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "willId" varchar,
                "sessionExpiryInterval" integer,
                "receiveMaximum" integer,
                "maximumPacketSize" integer,
                "topicAliasMaximum" integer,
                "requestResponseInformation" boolean,
                "requestProblemInformation" boolean,
                "userProperties" varchar,
                "authenticationMethod" varchar,
                "authenticationData" blob,
                CONSTRAINT "REL_71db93dbf719b8b12e835e343f" UNIQUE ("willId"),
                CONSTRAINT "FK_9beef409e9fbe4bd50dd024bac4" FOREIGN KEY ("parent_id") REFERENCES "CollectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_71db93dbf719b8b12e835e343fe" FOREIGN KEY ("willId") REFERENCES "WillEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "ConnectionEntity"(
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
                    "parent_id",
                    "orderId",
                    "rejectUnauthorized",
                    "ca",
                    "cert",
                    "key",
                    "isCollection",
                    "createAt",
                    "updateAt",
                    "willId",
                    "sessionExpiryInterval",
                    "receiveMaximum",
                    "maximumPacketSize",
                    "topicAliasMaximum",
                    "requestResponseInformation",
                    "requestProblemInformation",
                    "userProperties",
                    "authenticationMethod",
                    "authenticationData"
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
                "parent_id",
                "orderId",
                "rejectUnauthorized",
                "ca",
                "cert",
                "key",
                "isCollection",
                "createAt",
                "updateAt",
                "willId",
                "sessionExpiryInterval",
                "receiveMaximum",
                "maximumPacketSize",
                "topicAliasMaximum",
                "requestResponseInformation",
                "requestProblemInformation",
                "userProperties",
                "authenticationMethod",
                "authenticationData"
            FROM "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6fcc95296b7ab85477d47b698f" ON "ConnectionEntity" ("client_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "WillEntity"
                RENAME TO "temporary_WillEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "WillEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "lastWillTopic" varchar NOT NULL DEFAULT (''),
                "lastWillPayload" varchar NOT NULL DEFAULT (''),
                "lastWillQos" varchar CHECK(lastWillQos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "lastWillRetain" boolean NOT NULL DEFAULT (0),
                "willDelayInterval" integer,
                "payloadFormatIndicator" boolean,
                "messageExpiryInterval" integer,
                "contentType" varchar,
                "responseTopic" varchar,
                "correlationData" blob,
                "userProperties" varchar
            )
        `)
    await queryRunner.query(`
            INSERT INTO "WillEntity"(
                    "id",
                    "lastWillTopic",
                    "lastWillPayload",
                    "lastWillQos",
                    "lastWillRetain",
                    "willDelayInterval",
                    "payloadFormatIndicator",
                    "messageExpiryInterval",
                    "contentType",
                    "responseTopic",
                    "correlationData",
                    "userProperties"
                )
            SELECT "id",
                "lastWillTopic",
                "lastWillPayload",
                "lastWillQos",
                "lastWillRetain",
                "willDelayInterval",
                "payloadFormatIndicator",
                "messageExpiryInterval",
                "contentType",
                "responseTopic",
                "correlationData",
                "userProperties"
            FROM "temporary_WillEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_WillEntity"
        `)
  }
}

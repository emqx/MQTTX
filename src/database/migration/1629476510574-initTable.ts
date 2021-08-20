import { MigrationInterface, QueryRunner } from 'typeorm'

export class initTable1629476510574 implements MigrationInterface {
  name = 'initTable1629476510574'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "MessageEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "out" boolean NOT NULL,
                "payload" varchar NOT NULL,
                "qos" varchar CHECK(qos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "connection_id" varchar
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "SubscriptionEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "topic" varchar NOT NULL,
                "qos" varchar CHECK(qos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "alias" varchar,
                "retain" boolean DEFAULT (0),
                "color" varchar,
                "connection_id" varchar
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "CollectionEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar NOT NULL,
                "orderId" integer DEFAULT (0),
                "isCollection" boolean NOT NULL DEFAULT (1),
                "parentId" varchar
            )
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
                "contentType" varchar DEFAULT ('')
            )
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
                "certType" varchar CHECK(certType IN ('', 'server', 'self')) DEFAULT (''),
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
                CONSTRAINT "REL_71db93dbf719b8b12e835e343f" UNIQUE ("willId")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6fcc95296b7ab85477d47b698f" ON "ConnectionEntity" ("client_id")
        `)
    await queryRunner.query(`
            CREATE TABLE "ScriptEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
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
                "autoResub" boolean NOT NULL DEFAULT (1),
                "cleanAt" datetime
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "historyMessageHeaderEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "qos" varchar CHECK(qos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "historyMessagePayloadEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "payload" varchar NOT NULL,
                "payloadType" varchar CHECK(
                    payloadType IN ('Plaintext', 'Base64', 'JSON', 'Hex')
                ) NOT NULL DEFAULT ('JSON'),
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "CollectionEntity_closure" (
                "id_ancestor" varchar NOT NULL,
                "id_descendant" varchar NOT NULL,
                PRIMARY KEY ("id_ancestor", "id_descendant")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_3afa937bf76afed51491ab293e" ON "CollectionEntity_closure" ("id_ancestor")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_83641d182be4a76771e88107e1" ON "CollectionEntity_closure" ("id_descendant")
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_MessageEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
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
    await queryRunner.query(`
            CREATE TABLE "temporary_SubscriptionEntity" (
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
    await queryRunner.query(`
            CREATE TABLE "temporary_CollectionEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar NOT NULL,
                "orderId" integer DEFAULT (0),
                "isCollection" boolean NOT NULL DEFAULT (1),
                "parentId" varchar,
                CONSTRAINT "FK_8996536c4d9b9627757934dcd61" FOREIGN KEY ("parentId") REFERENCES "CollectionEntity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_CollectionEntity"(
                    "id",
                    "name",
                    "orderId",
                    "isCollection",
                    "parentId"
                )
            SELECT "id",
                "name",
                "orderId",
                "isCollection",
                "parentId"
            FROM "CollectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "CollectionEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_CollectionEntity"
                RENAME TO "CollectionEntity"
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
                "certType" varchar CHECK(certType IN ('', 'server', 'self')) DEFAULT (''),
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
                "parent_id",
                "orderId",
                "rejectUnauthorized",
                "ca",
                "cert",
                "key",
                "isCollection",
                "createAt",
                "updateAt",
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
            CREATE UNIQUE INDEX "IDX_6fcc95296b7ab85477d47b698f" ON "ConnectionEntity" ("client_id")
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_3afa937bf76afed51491ab293e"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_83641d182be4a76771e88107e1"
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_CollectionEntity_closure" (
                "id_ancestor" varchar NOT NULL,
                "id_descendant" varchar NOT NULL,
                CONSTRAINT "FK_3afa937bf76afed51491ab293e8" FOREIGN KEY ("id_ancestor") REFERENCES "CollectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_83641d182be4a76771e88107e1b" FOREIGN KEY ("id_descendant") REFERENCES "CollectionEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                PRIMARY KEY ("id_ancestor", "id_descendant")
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_CollectionEntity_closure"("id_ancestor", "id_descendant")
            SELECT "id_ancestor",
                "id_descendant"
            FROM "CollectionEntity_closure"
        `)
    await queryRunner.query(`
            DROP TABLE "CollectionEntity_closure"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_CollectionEntity_closure"
                RENAME TO "CollectionEntity_closure"
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_3afa937bf76afed51491ab293e" ON "CollectionEntity_closure" ("id_ancestor")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_83641d182be4a76771e88107e1" ON "CollectionEntity_closure" ("id_descendant")
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
            DROP INDEX "IDX_83641d182be4a76771e88107e1"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_3afa937bf76afed51491ab293e"
        `)
    await queryRunner.query(`
            ALTER TABLE "CollectionEntity_closure"
                RENAME TO "temporary_CollectionEntity_closure"
        `)
    await queryRunner.query(`
            CREATE TABLE "CollectionEntity_closure" (
                "id_ancestor" varchar NOT NULL,
                "id_descendant" varchar NOT NULL,
                PRIMARY KEY ("id_ancestor", "id_descendant")
            )
        `)
    await queryRunner.query(`
            INSERT INTO "CollectionEntity_closure"("id_ancestor", "id_descendant")
            SELECT "id_ancestor",
                "id_descendant"
            FROM "temporary_CollectionEntity_closure"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_CollectionEntity_closure"
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_83641d182be4a76771e88107e1" ON "CollectionEntity_closure" ("id_descendant")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_3afa937bf76afed51491ab293e" ON "CollectionEntity_closure" ("id_ancestor")
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
                "certType" varchar CHECK(certType IN ('', 'server', 'self')) DEFAULT (''),
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
                CONSTRAINT "REL_71db93dbf719b8b12e835e343f" UNIQUE ("willId")
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
                "parent_id",
                "orderId",
                "rejectUnauthorized",
                "ca",
                "cert",
                "key",
                "isCollection",
                "createAt",
                "updateAt",
                "willId"
            FROM "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_ConnectionEntity"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6fcc95296b7ab85477d47b698f" ON "ConnectionEntity" ("client_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "CollectionEntity"
                RENAME TO "temporary_CollectionEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "CollectionEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar NOT NULL,
                "orderId" integer DEFAULT (0),
                "isCollection" boolean NOT NULL DEFAULT (1),
                "parentId" varchar
            )
        `)
    await queryRunner.query(`
            INSERT INTO "CollectionEntity"(
                    "id",
                    "name",
                    "orderId",
                    "isCollection",
                    "parentId"
                )
            SELECT "id",
                "name",
                "orderId",
                "isCollection",
                "parentId"
            FROM "temporary_CollectionEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_CollectionEntity"
        `)
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
                "connection_id" varchar
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
    await queryRunner.query(`
            ALTER TABLE "MessageEntity"
                RENAME TO "temporary_MessageEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "MessageEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "createAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "out" boolean NOT NULL,
                "payload" varchar NOT NULL,
                "qos" varchar CHECK(qos IN ('0', '1', '2')) NOT NULL DEFAULT (0),
                "retain" boolean NOT NULL,
                "topic" varchar NOT NULL,
                "connection_id" varchar
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
    await queryRunner.query(`
            DROP INDEX "IDX_83641d182be4a76771e88107e1"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_3afa937bf76afed51491ab293e"
        `)
    await queryRunner.query(`
            DROP TABLE "CollectionEntity_closure"
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
            DROP INDEX "IDX_6fcc95296b7ab85477d47b698f"
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

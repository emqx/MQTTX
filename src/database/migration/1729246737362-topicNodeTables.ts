import { MigrationInterface, QueryRunner } from 'typeorm'

export class topicNodeTables1729246737362 implements MigrationInterface {
  name = 'topicNodeTables1729246737362'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "TopicNodeEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "label" varchar NOT NULL,
                "messageCount" integer NOT NULL DEFAULT (0),
                "subTopicCount" integer NOT NULL DEFAULT (0),
                "connectionId" varchar,
                "parentId" varchar,
                "messageId" varchar,
                CONSTRAINT "REL_6fe783d1bdc3b849839616e42f" UNIQUE ("messageId")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "TopicNodeEntity_closure" (
                "id_ancestor" varchar NOT NULL,
                "id_descendant" varchar NOT NULL,
                PRIMARY KEY ("id_ancestor", "id_descendant")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_7c6f4f73c21850bf9201c05873" ON "TopicNodeEntity_closure" ("id_ancestor")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_d91ce267b3b757cc4cea9b574d" ON "TopicNodeEntity_closure" ("id_descendant")
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_TopicNodeEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "label" varchar NOT NULL,
                "messageCount" integer NOT NULL DEFAULT (0),
                "subTopicCount" integer NOT NULL DEFAULT (0),
                "connectionId" varchar,
                "parentId" varchar,
                "messageId" varchar,
                CONSTRAINT "REL_6fe783d1bdc3b849839616e42f" UNIQUE ("messageId"),
                CONSTRAINT "FK_64c4c6f03f4ccedd1047e6d879f" FOREIGN KEY ("connectionId") REFERENCES "ConnectionEntity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_a6e507fb5ddd7275eb5e63cab1b" FOREIGN KEY ("parentId") REFERENCES "TopicNodeEntity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_6fe783d1bdc3b849839616e42f5" FOREIGN KEY ("messageId") REFERENCES "MessageEntity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_TopicNodeEntity"(
                    "id",
                    "label",
                    "messageCount",
                    "subTopicCount",
                    "connectionId",
                    "parentId",
                    "messageId"
                )
            SELECT "id",
                "label",
                "messageCount",
                "subTopicCount",
                "connectionId",
                "parentId",
                "messageId"
            FROM "TopicNodeEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "TopicNodeEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_TopicNodeEntity"
                RENAME TO "TopicNodeEntity"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_7c6f4f73c21850bf9201c05873"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_d91ce267b3b757cc4cea9b574d"
        `)
    await queryRunner.query(`
            CREATE TABLE "temporary_TopicNodeEntity_closure" (
                "id_ancestor" varchar NOT NULL,
                "id_descendant" varchar NOT NULL,
                CONSTRAINT "FK_7c6f4f73c21850bf9201c05873f" FOREIGN KEY ("id_ancestor") REFERENCES "TopicNodeEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_d91ce267b3b757cc4cea9b574d5" FOREIGN KEY ("id_descendant") REFERENCES "TopicNodeEntity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                PRIMARY KEY ("id_ancestor", "id_descendant")
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_TopicNodeEntity_closure"("id_ancestor", "id_descendant")
            SELECT "id_ancestor",
                "id_descendant"
            FROM "TopicNodeEntity_closure"
        `)
    await queryRunner.query(`
            DROP TABLE "TopicNodeEntity_closure"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_TopicNodeEntity_closure"
                RENAME TO "TopicNodeEntity_closure"
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_7c6f4f73c21850bf9201c05873" ON "TopicNodeEntity_closure" ("id_ancestor")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_d91ce267b3b757cc4cea9b574d" ON "TopicNodeEntity_closure" ("id_descendant")
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_d91ce267b3b757cc4cea9b574d"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_7c6f4f73c21850bf9201c05873"
        `)
    await queryRunner.query(`
            ALTER TABLE "TopicNodeEntity_closure"
                RENAME TO "temporary_TopicNodeEntity_closure"
        `)
    await queryRunner.query(`
            CREATE TABLE "TopicNodeEntity_closure" (
                "id_ancestor" varchar NOT NULL,
                "id_descendant" varchar NOT NULL,
                PRIMARY KEY ("id_ancestor", "id_descendant")
            )
        `)
    await queryRunner.query(`
            INSERT INTO "TopicNodeEntity_closure"("id_ancestor", "id_descendant")
            SELECT "id_ancestor",
                "id_descendant"
            FROM "temporary_TopicNodeEntity_closure"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_TopicNodeEntity_closure"
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_d91ce267b3b757cc4cea9b574d" ON "TopicNodeEntity_closure" ("id_descendant")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_7c6f4f73c21850bf9201c05873" ON "TopicNodeEntity_closure" ("id_ancestor")
        `)
    await queryRunner.query(`
            ALTER TABLE "TopicNodeEntity"
                RENAME TO "temporary_TopicNodeEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "TopicNodeEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "label" varchar NOT NULL,
                "messageCount" integer NOT NULL DEFAULT (0),
                "subTopicCount" integer NOT NULL DEFAULT (0),
                "connectionId" varchar,
                "parentId" varchar,
                "messageId" varchar,
                CONSTRAINT "REL_6fe783d1bdc3b849839616e42f" UNIQUE ("messageId")
            )
        `)
    await queryRunner.query(`
            INSERT INTO "TopicNodeEntity"(
                    "id",
                    "label",
                    "messageCount",
                    "subTopicCount",
                    "connectionId",
                    "parentId",
                    "messageId"
                )
            SELECT "id",
                "label",
                "messageCount",
                "subTopicCount",
                "connectionId",
                "parentId",
                "messageId"
            FROM "temporary_TopicNodeEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_TopicNodeEntity"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_d91ce267b3b757cc4cea9b574d"
        `)
    await queryRunner.query(`
            DROP INDEX "IDX_7c6f4f73c21850bf9201c05873"
        `)
    await queryRunner.query(`
            DROP TABLE "TopicNodeEntity_closure"
        `)
    await queryRunner.query(`
            DROP TABLE "TopicNodeEntity"
        `)
  }
}

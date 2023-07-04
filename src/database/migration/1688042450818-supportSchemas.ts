import { MigrationInterface, QueryRunner } from 'typeorm'

export class supportSchemas1688042450818 implements MigrationInterface {
  name = 'supportSchemas1688042450818'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_ScriptEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar NOT NULL,
                "script" varchar NOT NULL,
                "type" varchar NULL DEFAULT NULL
            )
        `)
    await queryRunner.query(`
            INSERT INTO "temporary_ScriptEntity"("id", "name", "script")
            SELECT "id",
                "name",
                "script"
            FROM "ScriptEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "ScriptEntity"
        `)
    await queryRunner.query(`
            ALTER TABLE "temporary_ScriptEntity"
                RENAME TO "ScriptEntity"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "ScriptEntity"
                RENAME TO "temporary_ScriptEntity"
        `)
    await queryRunner.query(`
            CREATE TABLE "ScriptEntity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar NOT NULL,
                "script" varchar NOT NULL
            )
        `)
    await queryRunner.query(`
            INSERT INTO "ScriptEntity"("id", "name", "script")
            SELECT "id",
                "name",
                "script"
            FROM "temporary_ScriptEntity"
        `)
    await queryRunner.query(`
            DROP TABLE "temporary_ScriptEntity"
        `)
  }
}

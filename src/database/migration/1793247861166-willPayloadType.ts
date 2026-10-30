import { MigrationInterface, QueryRunner } from 'typeorm'

export class willPayloadType1793247861166 implements MigrationInterface {
  name = 'willPayloadType1793247861166'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add a column instead of rebuilding the table, which would delete linked connections.
    // Existing wills are all plain text.
    await queryRunner.query(`
            ALTER TABLE "WillEntity"
            ADD COLUMN "lastWillPayloadType" varchar NOT NULL DEFAULT ('Plaintext')
        `)
    await queryRunner.query(`
            ALTER TABLE "HistoryConnectionEntity"
            ADD COLUMN "lastWillPayloadType" varchar NOT NULL DEFAULT ('Plaintext')
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "WillEntity"
            DROP COLUMN "lastWillPayloadType"
        `)
    await queryRunner.query(`
            ALTER TABLE "HistoryConnectionEntity"
            DROP COLUMN "lastWillPayloadType"
        `)
  }
}

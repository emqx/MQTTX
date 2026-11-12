import { MigrationInterface, QueryRunner } from 'typeorm'

export class batchPublishing1794317483954 implements MigrationInterface {
  name = 'batchPublishing1794317483954'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add a column instead of rebuilding the table, preserving existing publish history.
    await queryRunner.query(`
            ALTER TABLE "historyMessageHeaderEntity"
            ADD COLUMN "batch" boolean NOT NULL DEFAULT (0)
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "historyMessageHeaderEntity"
            DROP COLUMN "batch"
        `)
  }
}

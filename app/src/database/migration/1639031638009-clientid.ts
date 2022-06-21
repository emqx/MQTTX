import { MigrationInterface, QueryRunner } from 'typeorm'

export class clientid1639031638009 implements MigrationInterface {
  name = 'clientid1639031638009'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_6fcc95296b7ab85477d47b698f"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6fcc95296b7ab85477d47b698f" ON "ConnectionEntity" ("client_id")
        `)
  }
}

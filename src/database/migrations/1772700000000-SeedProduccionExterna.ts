import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedProduccionExterna1772700000000 implements MigrationInterface {
  name = 'SeedProduccionExterna1772700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "supply_types" ("name") VALUES ('Produccion externa')
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "supply_types" WHERE "name" = 'Produccion externa'`,
    );
  }
}

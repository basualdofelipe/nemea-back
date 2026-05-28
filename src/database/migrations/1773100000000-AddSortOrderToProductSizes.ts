import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSortOrderToProductSizes1773100000000 implements MigrationInterface {
  name = 'AddSortOrderToProductSizes1773100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add sort_order column with default 0
    await queryRunner.query(
      `ALTER TABLE "product_sizes" ADD COLUMN "sort_order" SMALLINT NOT NULL DEFAULT 0`,
    );

    // Step 2: Set sort_order for known named sizes (spacing of 10 for future insertions)
    await queryRunner.query(
      `UPDATE "product_sizes" SET "sort_order" = CASE "name"
        WHEN 'Unico' THEN 0
        WHEN 'XS' THEN 5
        WHEN 'S' THEN 10
        WHEN 'Chico' THEN 15
        WHEN 'M' THEN 20
        WHEN 'Mediano' THEN 25
        WHEN 'L' THEN 30
        WHEN 'Grande!' THEN 35
        ELSE 50
      END
      WHERE "name" NOT SIMILAR TO '[0-9]+'`,
    );

    // Step 3: For numeric belt sizes (names matching only digits), set sort_order to their numeric value
    await queryRunner.query(
      `UPDATE "product_sizes" SET "sort_order" = CAST("name" AS INTEGER) WHERE "name" ~ '^[0-9]+$'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_sizes" DROP COLUMN "sort_order"`,
    );
  }
}

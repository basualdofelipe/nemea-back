import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1772500100000 implements MigrationInterface {
  name = 'CreateProductsTable1772500100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "sku_code" VARCHAR(50) NOT NULL,
        "product_type_id" UUID NOT NULL REFERENCES "product_types"("id"),
        "product_name_id" UUID NOT NULL REFERENCES "product_names"("id"),
        "product_finish_id" UUID NOT NULL REFERENCES "product_finishes"("id"),
        "product_color_id" UUID NOT NULL REFERENCES "product_colors"("id"),
        "product_size_id" UUID NOT NULL REFERENCES "product_sizes"("id"),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Partial unique index: only active products must have unique SKU
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_products_sku_code_active"
      ON "products" ("sku_code")
      WHERE "is_active" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products"`);
  }
}

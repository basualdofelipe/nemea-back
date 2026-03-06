import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBomAndPriceHistory1772500200000 implements MigrationInterface {
  name = 'CreateBomAndPriceHistory1772500200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create supplies_per_product_history (BOM) table
    await queryRunner.query(
      `CREATE TABLE "supplies_per_product_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "product_id" uuid NOT NULL,
        "supply_id" uuid NOT NULL,
        "quantity" decimal(10,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_supplies_per_product_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bom_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bom_supply" FOREIGN KEY ("supply_id") REFERENCES "supplies"("id")
      )`,
    );

    // Partial index for efficient active BOM lookups
    await queryRunner.query(
      `CREATE INDEX "IDX_bom_product_active" ON "supplies_per_product_history" ("product_id") WHERE "is_active" = true`,
    );

    // Create product_price_history table
    await queryRunner.query(
      `CREATE TABLE "product_price_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "product_id" uuid NOT NULL,
        "price" decimal(12,2) NOT NULL,
        "currency" varchar(10) NOT NULL DEFAULT 'ARS',
        CONSTRAINT "PK_product_price_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_price_history_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )`,
    );

    // Composite index for efficient latest-price queries
    await queryRunner.query(
      `CREATE INDEX "IDX_product_price_created" ON "product_price_history" ("product_id", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_product_price_created"`);
    await queryRunner.query(`DROP TABLE "product_price_history"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bom_product_active"`);
    await queryRunner.query(`DROP TABLE "supplies_per_product_history"`);
  }
}

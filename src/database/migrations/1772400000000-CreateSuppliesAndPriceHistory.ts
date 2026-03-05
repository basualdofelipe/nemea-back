import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuppliesAndPriceHistory1772400000000 implements MigrationInterface {
  name = 'CreateSuppliesAndPriceHistory1772400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for unit_type
    await queryRunner.query(
      `CREATE TYPE "public"."supplies_unit_type_enum" AS ENUM ('m2', 'unidad', 'metro', 'kg')`,
    );

    // Create supplies table
    await queryRunner.query(
      `CREATE TABLE "supplies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying(255) NOT NULL,
        "type_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "unit_type" "public"."supplies_unit_type_enum" NOT NULL DEFAULT 'unidad',
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_supplies_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_supplies_type" FOREIGN KEY ("type_id") REFERENCES "supply_types"("id"),
        CONSTRAINT "FK_supplies_supplier" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
      )`,
    );

    // Partial unique index: same name + supplier only unique among active supplies
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_supplies_name_supplier_active" ON "supplies" ("name", "supplier_id") WHERE "is_active" = true`,
    );

    // Create supply_price_history table
    await queryRunner.query(
      `CREATE TABLE "supply_price_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "supply_id" uuid NOT NULL,
        "price" decimal(12,2) NOT NULL,
        CONSTRAINT "PK_supply_price_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_supply_price_history_supply" FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE CASCADE
      )`,
    );

    // Composite index for efficient latest-price queries
    await queryRunner.query(
      `CREATE INDEX "idx_supply_price_history_supply_date" ON "supply_price_history" ("supply_id", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_supply_price_history_supply_date"`,
    );
    await queryRunner.query(`DROP TABLE "supply_price_history"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_supplies_name_supplier_active"`,
    );
    await queryRunner.query(`DROP TABLE "supplies"`);
    await queryRunner.query(`DROP TYPE "public"."supplies_unit_type_enum"`);
  }
}

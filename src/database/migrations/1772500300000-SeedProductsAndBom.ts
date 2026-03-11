import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedProductsAndBom1772500300000 implements MigrationInterface {
  name = 'SeedProductsAndBom1772500300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure "Unico" size has sku_code = 0
    await queryRunner.query(`
      UPDATE "product_sizes" SET "sku_code" = 0 WHERE "name" = 'Unico' AND "sku_code" IS NULL
    `);

    // Seed supplies for BOM (if not already present)
    await queryRunner.query(`
      INSERT INTO "supplies" ("name", "type_id", "supplier_id", "unit_type")
      SELECT 'Cuero Vaqueta', st.id, s.id, 'm2'
      FROM "supply_types" st, "suppliers" s
      WHERE st."name" = 'Cuero' AND s."name" = 'Curtiembre Central'
      AND NOT EXISTS (
        SELECT 1 FROM "supplies" WHERE "name" = 'Cuero Vaqueta'
        AND "supplier_id" = s.id AND "is_active" = true
      )
    `);

    await queryRunner.query(`
      INSERT INTO "supplies" ("name", "type_id", "supplier_id", "unit_type")
      SELECT 'Cierre YKK 20cm', st.id, s.id, 'unidad'
      FROM "supply_types" st, "suppliers" s
      WHERE st."name" = 'Herraje' AND s."name" = 'Herrajes BA'
      AND NOT EXISTS (
        SELECT 1 FROM "supplies" WHERE "name" = 'Cierre YKK 20cm'
        AND "supplier_id" = s.id AND "is_active" = true
      )
    `);

    await queryRunner.query(`
      INSERT INTO "supplies" ("name", "type_id", "supplier_id", "unit_type")
      SELECT 'Hilo Niquel truncado 8/3', st.id, s.id, 'metro'
      FROM "supply_types" st, "suppliers" s
      WHERE st."name" = 'Hilo' AND s."name" = 'Herrajes BA'
      AND NOT EXISTS (
        SELECT 1 FROM "supplies" WHERE "name" = 'Hilo Niquel truncado 8/3'
        AND "supplier_id" = s.id AND "is_active" = true
      )
    `);

    await queryRunner.query(`
      INSERT INTO "supplies" ("name", "type_id", "supplier_id", "unit_type")
      SELECT 'Caja regalo', st.id, s.id, 'unidad'
      FROM "supply_types" st, "suppliers" s
      WHERE st."name" = 'Packaging' AND s."name" = 'Embalajes Express'
      AND NOT EXISTS (
        SELECT 1 FROM "supplies" WHERE "name" = 'Caja regalo'
        AND "supplier_id" = s.id AND "is_active" = true
      )
    `);

    // Seed supply prices for new supplies
    await queryRunner.query(`
      INSERT INTO "supply_price_history" ("supply_id", "price")
      SELECT s.id, 15000.00
      FROM "supplies" s WHERE s."name" = 'Cuero Vaqueta' AND s."is_active" = true
      AND NOT EXISTS (SELECT 1 FROM "supply_price_history" WHERE "supply_id" = s.id)
    `);

    await queryRunner.query(`
      INSERT INTO "supply_price_history" ("supply_id", "price")
      SELECT s.id, 850.00
      FROM "supplies" s WHERE s."name" = 'Cierre YKK 20cm' AND s."is_active" = true
      AND NOT EXISTS (SELECT 1 FROM "supply_price_history" WHERE "supply_id" = s.id)
    `);

    await queryRunner.query(`
      INSERT INTO "supply_price_history" ("supply_id", "price")
      SELECT s.id, 200.00
      FROM "supplies" s WHERE s."name" = 'Hilo Niquel truncado 8/3' AND s."is_active" = true
      AND NOT EXISTS (SELECT 1 FROM "supply_price_history" WHERE "supply_id" = s.id)
    `);

    await queryRunner.query(`
      INSERT INTO "supply_price_history" ("supply_id", "price")
      SELECT s.id, 1500.00
      FROM "supplies" s WHERE s."name" = 'Caja regalo' AND s."is_active" = true
      AND NOT EXISTS (SELECT 1 FROM "supply_price_history" WHERE "supply_id" = s.id)
    `);

    // Seed products: Billetera Hefesto Lisa in Marron, Negro, Suela (Talle Unico)
    await queryRunner.query(`
      INSERT INTO "products" ("sku_code", "product_type_id", "product_name_id", "product_finish_id", "product_color_id", "product_size_id")
      SELECT
        pt."sku_code" || '.' || pn."sku_code" || '.' || pf."sku_code" || '.' || pc."sku_code" || '.' || ps."sku_code",
        pt.id, pn.id, pf.id, pc.id, ps.id
      FROM "product_types" pt, "product_names" pn, "product_finishes" pf, "product_colors" pc, "product_sizes" ps
      WHERE pt."name" = 'Billetera' AND pn."name" = 'Hefesto' AND pf."name" = 'Lisa'
        AND pc."name" = 'Marron' AND ps."name" = 'Unico'
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "products" ("sku_code", "product_type_id", "product_name_id", "product_finish_id", "product_color_id", "product_size_id")
      SELECT
        pt."sku_code" || '.' || pn."sku_code" || '.' || pf."sku_code" || '.' || pc."sku_code" || '.' || ps."sku_code",
        pt.id, pn.id, pf.id, pc.id, ps.id
      FROM "product_types" pt, "product_names" pn, "product_finishes" pf, "product_colors" pc, "product_sizes" ps
      WHERE pt."name" = 'Billetera' AND pn."name" = 'Hefesto' AND pf."name" = 'Lisa'
        AND pc."name" = 'Negro' AND ps."name" = 'Unico'
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "products" ("sku_code", "product_type_id", "product_name_id", "product_finish_id", "product_color_id", "product_size_id")
      SELECT
        pt."sku_code" || '.' || pn."sku_code" || '.' || pf."sku_code" || '.' || pc."sku_code" || '.' || ps."sku_code",
        pt.id, pn.id, pf.id, pc.id, ps.id
      FROM "product_types" pt, "product_names" pn, "product_finishes" pf, "product_colors" pc, "product_sizes" ps
      WHERE pt."name" = 'Billetera' AND pn."name" = 'Hefesto' AND pf."name" = 'Lisa'
        AND pc."name" = 'Suela' AND ps."name" = 'Unico'
      ON CONFLICT DO NOTHING
    `);

    // Cinturon Ares Grabada in Negro, Marron (Talle Unico)
    await queryRunner.query(`
      INSERT INTO "products" ("sku_code", "product_type_id", "product_name_id", "product_finish_id", "product_color_id", "product_size_id")
      SELECT
        pt."sku_code" || '.' || pn."sku_code" || '.' || pf."sku_code" || '.' || pc."sku_code" || '.' || ps."sku_code",
        pt.id, pn.id, pf.id, pc.id, ps.id
      FROM "product_types" pt, "product_names" pn, "product_finishes" pf, "product_colors" pc, "product_sizes" ps
      WHERE pt."name" = 'Cinturon' AND pn."name" = 'Ares' AND pf."name" = 'Grabada'
        AND pc."name" = 'Negro' AND ps."name" = 'Unico'
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "products" ("sku_code", "product_type_id", "product_name_id", "product_finish_id", "product_color_id", "product_size_id")
      SELECT
        pt."sku_code" || '.' || pn."sku_code" || '.' || pf."sku_code" || '.' || pc."sku_code" || '.' || ps."sku_code",
        pt.id, pn.id, pf.id, pc.id, ps.id
      FROM "product_types" pt, "product_names" pn, "product_finishes" pf, "product_colors" pc, "product_sizes" ps
      WHERE pt."name" = 'Cinturon' AND pn."name" = 'Ares' AND pf."name" = 'Grabada'
        AND pc."name" = 'Marron' AND ps."name" = 'Unico'
      ON CONFLICT DO NOTHING
    `);

    // Deskpad Hermes Lisa in Natural (Talle Grande)
    await queryRunner.query(`
      INSERT INTO "products" ("sku_code", "product_type_id", "product_name_id", "product_finish_id", "product_color_id", "product_size_id")
      SELECT
        pt."sku_code" || '.' || pn."sku_code" || '.' || pf."sku_code" || '.' || pc."sku_code" || '.' || ps."sku_code",
        pt.id, pn.id, pf.id, pc.id, ps.id
      FROM "product_types" pt, "product_names" pn, "product_finishes" pf, "product_colors" pc, "product_sizes" ps
      WHERE pt."name" = 'Deskpad' AND pn."name" = 'Hermes' AND pf."name" = 'Lisa'
        AND pc."name" = 'Natural' AND ps."name" = 'Grande'
      ON CONFLICT DO NOTHING
    `);

    // Seed BOM entries for Billetera Hefesto Lisa (all colors use same BOM)
    // BOM: Cuero Vaqueta 0.12 m2, Cierre YKK 20cm 1 unidad, Hilo 2 metros, Caja 1 unidad
    await queryRunner.query(`
      INSERT INTO "supplies_per_product_history" ("product_id", "supply_id", "quantity", "is_active")
      SELECT p.id, s.id, 0.12, true
      FROM "products" p
      JOIN "product_types" pt ON p."product_type_id" = pt.id
      JOIN "product_names" pn ON p."product_name_id" = pn.id
      CROSS JOIN "supplies" s
      WHERE pt."name" = 'Billetera' AND pn."name" = 'Hefesto'
        AND s."name" = 'Cuero Vaqueta' AND s."is_active" = true
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "supplies_per_product_history" ("product_id", "supply_id", "quantity", "is_active")
      SELECT p.id, s.id, 1, true
      FROM "products" p
      JOIN "product_types" pt ON p."product_type_id" = pt.id
      JOIN "product_names" pn ON p."product_name_id" = pn.id
      CROSS JOIN "supplies" s
      WHERE pt."name" = 'Billetera' AND pn."name" = 'Hefesto'
        AND s."name" = 'Cierre YKK 20cm' AND s."is_active" = true
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "supplies_per_product_history" ("product_id", "supply_id", "quantity", "is_active")
      SELECT p.id, s.id, 2, true
      FROM "products" p
      JOIN "product_types" pt ON p."product_type_id" = pt.id
      JOIN "product_names" pn ON p."product_name_id" = pn.id
      CROSS JOIN "supplies" s
      WHERE pt."name" = 'Billetera' AND pn."name" = 'Hefesto'
        AND s."name" = 'Hilo Niquel truncado 8/3' AND s."is_active" = true
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "supplies_per_product_history" ("product_id", "supply_id", "quantity", "is_active")
      SELECT p.id, s.id, 1, true
      FROM "products" p
      JOIN "product_types" pt ON p."product_type_id" = pt.id
      JOIN "product_names" pn ON p."product_name_id" = pn.id
      CROSS JOIN "supplies" s
      WHERE pt."name" = 'Billetera' AND pn."name" = 'Hefesto'
        AND s."name" = 'Caja regalo' AND s."is_active" = true
      ON CONFLICT DO NOTHING
    `);

    // Seed BOM for Deskpad Hermes (more cuero, no cierre)
    await queryRunner.query(`
      INSERT INTO "supplies_per_product_history" ("product_id", "supply_id", "quantity", "is_active")
      SELECT p.id, s.id, 0.50, true
      FROM "products" p
      JOIN "product_types" pt ON p."product_type_id" = pt.id
      JOIN "product_names" pn ON p."product_name_id" = pn.id
      CROSS JOIN "supplies" s
      WHERE pt."name" = 'Deskpad' AND pn."name" = 'Hermes'
        AND s."name" = 'Cuero Vaqueta' AND s."is_active" = true
      ON CONFLICT DO NOTHING
    `);

    // Seed selling prices for all products
    await queryRunner.query(`
      INSERT INTO "product_price_history" ("product_id", "price")
      SELECT p.id, 25000.00
      FROM "products" p
      JOIN "product_types" pt ON p."product_type_id" = pt.id
      WHERE pt."name" = 'Billetera'
    `);

    await queryRunner.query(`
      INSERT INTO "product_price_history" ("product_id", "price")
      SELECT p.id, 22000.00
      FROM "products" p
      JOIN "product_types" pt ON p."product_type_id" = pt.id
      WHERE pt."name" = 'Cinturon'
    `);

    await queryRunner.query(`
      INSERT INTO "product_price_history" ("product_id", "price")
      SELECT p.id, 35000.00
      FROM "products" p
      JOIN "product_types" pt ON p."product_type_id" = pt.id
      WHERE pt."name" = 'Deskpad'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove seeded price history
    await queryRunner.query(`
      DELETE FROM "product_price_history" WHERE "product_id" IN (
        SELECT id FROM "products" WHERE "sku_code" IN (
          SELECT pt."sku_code" || '.' || pn."sku_code" || '.' || pf."sku_code" || '.' || pc."sku_code" || '.' || ps."sku_code"
          FROM "product_types" pt, "product_names" pn, "product_finishes" pf, "product_colors" pc, "product_sizes" ps
          WHERE pt."name" IN ('Billetera', 'Cinturon', 'Deskpad')
            AND pn."name" IN ('Hefesto', 'Ares', 'Hermes')
        )
      )
    `);

    // Remove seeded BOM entries
    await queryRunner.query(`
      DELETE FROM "supplies_per_product_history" WHERE "product_id" IN (
        SELECT id FROM "products" WHERE "sku_code" LIKE '%.%'
      )
    `);

    // Remove seeded products
    await queryRunner.query(`
      DELETE FROM "products" WHERE "sku_code" LIKE '%.%'
    `);

    // Remove seeded supply prices
    await queryRunner.query(`
      DELETE FROM "supply_price_history" WHERE "supply_id" IN (
        SELECT id FROM "supplies" WHERE "name" IN ('Cuero Vaqueta', 'Cierre YKK 20cm', 'Hilo Niquel truncado 8/3', 'Caja regalo')
      )
    `);

    // Remove seeded supplies
    await queryRunner.query(`
      DELETE FROM "supplies" WHERE "name" IN ('Cuero Vaqueta', 'Cierre YKK 20cm', 'Hilo Niquel truncado 8/3', 'Caja regalo')
    `);
  }
}

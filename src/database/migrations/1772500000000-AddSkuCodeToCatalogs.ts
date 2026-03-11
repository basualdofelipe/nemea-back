import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkuCodeToCatalogs1772500000000 implements MigrationInterface {
  name = 'AddSkuCodeToCatalogs1772500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add sku_code column (nullable first) to all 5 catalog dimension tables
    const tables = [
      'product_types',
      'product_names',
      'product_finishes',
      'product_colors',
      'product_sizes',
    ];

    for (const table of tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN "sku_code" SMALLINT NULL`,
      );
    }

    // Seed sku_code values for known catalog items (from phase 3 seed)
    // product_types: Billetera=1, Cinturon=2, Deskpad=3, Porta Notebook=4, Mochila=5
    await queryRunner.query(`
      UPDATE "product_types" SET "sku_code" = CASE "name"
        WHEN 'Billetera' THEN 1
        WHEN 'Cinturon' THEN 2
        WHEN 'Deskpad' THEN 3
        WHEN 'Porta Notebook' THEN 4
        WHEN 'Mochila' THEN 5
      END
      WHERE "name" IN ('Billetera', 'Cinturon', 'Deskpad', 'Porta Notebook', 'Mochila')
    `);

    // product_names: Hefesto=1, Ares=2, Hermes=3, Apolo=4, Poseidon=5, Artemisa=6, Atenea=7, Afrodita=8
    await queryRunner.query(`
      UPDATE "product_names" SET "sku_code" = CASE "name"
        WHEN 'Hefesto' THEN 1
        WHEN 'Ares' THEN 2
        WHEN 'Hermes' THEN 3
        WHEN 'Apolo' THEN 4
        WHEN 'Poseidon' THEN 5
        WHEN 'Artemisa' THEN 6
        WHEN 'Atenea' THEN 7
        WHEN 'Afrodita' THEN 8
      END
      WHERE "name" IN ('Hefesto', 'Ares', 'Hermes', 'Apolo', 'Poseidon', 'Artemisa', 'Atenea', 'Afrodita')
    `);

    // product_finishes: Lisa=1, Grabada=2, Saffiano=3, Floater=4
    await queryRunner.query(`
      UPDATE "product_finishes" SET "sku_code" = CASE "name"
        WHEN 'Lisa' THEN 1
        WHEN 'Grabada' THEN 2
        WHEN 'Saffiano' THEN 3
        WHEN 'Floater' THEN 4
      END
      WHERE "name" IN ('Lisa', 'Grabada', 'Saffiano', 'Floater')
    `);

    // product_colors: Marron=1, Negro=2, Suela=3, Bordo=4, Azul=5, Verde=6, Natural=7
    await queryRunner.query(`
      UPDATE "product_colors" SET "sku_code" = CASE "name"
        WHEN 'Marron' THEN 1
        WHEN 'Negro' THEN 2
        WHEN 'Suela' THEN 3
        WHEN 'Bordo' THEN 4
        WHEN 'Azul' THEN 5
        WHEN 'Verde' THEN 6
        WHEN 'Natural' THEN 7
      END
      WHERE "name" IN ('Marron', 'Negro', 'Suela', 'Bordo', 'Azul', 'Verde', 'Natural')
    `);

    // product_sizes: Unico=0, Chico=1, Mediano=2, Grande=3
    await queryRunner.query(`
      UPDATE "product_sizes" SET "sku_code" = CASE "name"
        WHEN 'Unico' THEN 0
        WHEN 'Chico' THEN 1
        WHEN 'Mediano' THEN 2
        WHEN 'Grande' THEN 3
      END
      WHERE "name" IN ('Unico', 'Chico', 'Mediano', 'Grande')
    `);

    // Assign sku_codes to any remaining rows (user-created catalog items)
    // Uses ROW_NUMBER to continue from the max existing sku_code per table
    for (const table of tables) {
      // product_sizes uses 0-based (Unico=0), others use 1-based
      await queryRunner.query(`
        UPDATE "${table}" t
        SET "sku_code" = sub.new_code
        FROM (
          SELECT id,
            ROW_NUMBER() OVER (ORDER BY "created_at", "name") +
            COALESCE((SELECT MAX("sku_code") FROM "${table}" WHERE "sku_code" IS NOT NULL), 0)
            AS new_code
          FROM "${table}"
          WHERE "sku_code" IS NULL
        ) sub
        WHERE t.id = sub.id
      `);
    }

    // Make sku_code NOT NULL and add UNIQUE constraint
    for (const table of tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "sku_code" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "UQ_${table}_sku_code" UNIQUE ("sku_code")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'product_types',
      'product_names',
      'product_finishes',
      'product_colors',
      'product_sizes',
    ];

    for (const table of tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT "UQ_${table}_sku_code"`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "sku_code"`);
    }
  }
}

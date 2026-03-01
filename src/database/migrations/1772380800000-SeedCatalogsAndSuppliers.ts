import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCatalogsAndSuppliers1772380800000 implements MigrationInterface {
  name = 'SeedCatalogsAndSuppliers1772380800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "product_types" ("name") VALUES
        ('Billetera'), ('Cinturon'), ('Deskpad'), ('Porta Notebook'), ('Mochila')
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "product_names" ("name") VALUES
        ('Hefesto'), ('Ares'), ('Hermes'), ('Apolo'),
        ('Poseidon'), ('Artemisa'), ('Atenea'), ('Afrodita')
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "product_finishes" ("name") VALUES
        ('Lisa'), ('Grabada'), ('Saffiano'), ('Floater')
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "product_colors" ("name") VALUES
        ('Marron'), ('Negro'), ('Suela'), ('Bordo'),
        ('Azul'), ('Verde'), ('Natural')
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "product_sizes" ("name") VALUES
        ('Unico'), ('Chico'), ('Mediano'), ('Grande')
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "supply_types" ("name") VALUES
        ('Cuero'), ('Herraje'), ('Packaging'), ('Hilo'),
        ('Adhesivo'), ('Tela'), ('Varios')
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "suppliers" ("name", "description") VALUES
        ('Curtiembre Central', 'Proveedor principal de cueros'),
        ('Herrajes BA', 'Proveedor de herrajes y accesorios'),
        ('Embalajes Express', 'Packaging y materiales de envio')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "suppliers" WHERE "name" IN ('Curtiembre Central', 'Herrajes BA', 'Embalajes Express')`,
    );
    await queryRunner.query(
      `DELETE FROM "supply_types" WHERE "name" IN ('Cuero', 'Herraje', 'Packaging', 'Hilo', 'Adhesivo', 'Tela', 'Varios')`,
    );
    await queryRunner.query(
      `DELETE FROM "product_sizes" WHERE "name" IN ('Unico', 'Chico', 'Mediano', 'Grande')`,
    );
    await queryRunner.query(
      `DELETE FROM "product_colors" WHERE "name" IN ('Marron', 'Negro', 'Suela', 'Bordo', 'Azul', 'Verde', 'Natural')`,
    );
    await queryRunner.query(
      `DELETE FROM "product_finishes" WHERE "name" IN ('Lisa', 'Grabada', 'Saffiano', 'Floater')`,
    );
    await queryRunner.query(
      `DELETE FROM "product_names" WHERE "name" IN ('Hefesto', 'Ares', 'Hermes', 'Apolo', 'Poseidon', 'Artemisa', 'Atenea', 'Afrodita')`,
    );
    await queryRunner.query(
      `DELETE FROM "product_types" WHERE "name" IN ('Billetera', 'Cinturon', 'Deskpad', 'Porta Notebook', 'Mochila')`,
    );
  }
}

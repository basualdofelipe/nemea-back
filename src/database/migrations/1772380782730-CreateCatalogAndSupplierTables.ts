import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCatalogAndSupplierTables1772380782730 implements MigrationInterface {
  name = 'CreateCatalogAndSupplierTables1772380782730';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "address" character varying(500), "email" character varying(255), "phone" character varying(50), "whatsapp" character varying(50), "description" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_suppliers_name_active" ON "suppliers" ("name") WHERE "is_active" = true`,
    );
    await queryRunner.query(
      `CREATE TABLE "supply_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, CONSTRAINT "UQ_03150cac1a681c3ebc39b66f810" UNIQUE ("name"), CONSTRAINT "PK_8b7e11c5743aacc774ee281623e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, CONSTRAINT "UQ_2b3bfea1c7797e9d067dfc3c7a0" UNIQUE ("name"), CONSTRAINT "PK_6ad7b08e6491a02ebc9ed82019d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_sizes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, CONSTRAINT "UQ_20e4a7ce823f8d000cbe8848624" UNIQUE ("name"), CONSTRAINT "PK_19c3d021f81c5b1ff367bad6164" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_names" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, CONSTRAINT "UQ_fdce5c646f22fc1bfc5b1202d06" UNIQUE ("name"), CONSTRAINT "PK_33c2b3a8b6b66ad65a3157c4a9e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_finishes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, CONSTRAINT "UQ_c9e3e52abd71e4dc161cca226fb" UNIQUE ("name"), CONSTRAINT "PK_2bb09257f265d738b39cb600a03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_colors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, CONSTRAINT "UQ_d360f3a88ca753c9bbaf1e7e67f" UNIQUE ("name"), CONSTRAINT "PK_9751ccb35a2b98e8b48e4baa4fe" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_colors"`);
    await queryRunner.query(`DROP TABLE "product_finishes"`);
    await queryRunner.query(`DROP TABLE "product_names"`);
    await queryRunner.query(`DROP TABLE "product_sizes"`);
    await queryRunner.query(`DROP TABLE "product_types"`);
    await queryRunner.query(`DROP TABLE "supply_types"`);
    await queryRunner.query(`DROP INDEX "public"."idx_suppliers_name_active"`);
    await queryRunner.query(`DROP TABLE "suppliers"`);
  }
}

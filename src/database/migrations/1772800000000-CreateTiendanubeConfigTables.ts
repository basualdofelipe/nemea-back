import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTiendanubeConfigTables1772800000000 implements MigrationInterface {
  name = 'CreateTiendanubeConfigTables1772800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create tn_plans (no FK deps)
    await queryRunner.query(
      `CREATE TABLE "tn_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "slug" character varying(50) NOT NULL,
        "label" character varying(100) NOT NULL,
        "cpt_pago_nube" decimal(5,2) NOT NULL,
        "cpt_other_gateways" decimal(5,2) NOT NULL,
        "only_pago_nube" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_tn_plans_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tn_plans_slug" UNIQUE ("slug")
      )`,
    );

    // 2. Create tn_payment_gateways (no FK deps)
    await queryRunner.query(
      `CREATE TABLE "tn_payment_gateways" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "slug" character varying(50) NOT NULL,
        "label" character varying(100) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_tn_payment_gateways_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tn_payment_gateways_slug" UNIQUE ("slug")
      )`,
    );

    // 3. Create tn_gateway_rates (FK to tn_payment_gateways)
    await queryRunner.query(
      `CREATE TABLE "tn_gateway_rates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "gateway_id" uuid NOT NULL,
        "payment_method" character varying(50) NOT NULL,
        "withdrawal_days" integer NOT NULL,
        "rate_percent" decimal(5,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_tn_gateway_rates_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tn_gateway_rates_gateway" FOREIGN KEY ("gateway_id") REFERENCES "tn_payment_gateways"("id") ON DELETE CASCADE
      )`,
    );

    // Composite index for efficient "latest rate" queries
    await queryRunner.query(
      `CREATE INDEX "IDX_tn_gateway_rates_lookup" ON "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "created_at" DESC)`,
    );

    // 4. Create tn_installment_rates (no FK deps)
    await queryRunner.query(
      `CREATE TABLE "tn_installment_rates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "installments" integer NOT NULL,
        "rate_percent" decimal(5,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_tn_installment_rates_id" PRIMARY KEY ("id")
      )`,
    );

    // 5. Create tn_tax_config (no FK deps)
    await queryRunner.query(
      `CREATE TABLE "tn_tax_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "iva_rate" decimal(5,2) NOT NULL,
        "iibb_rate" decimal(5,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_tn_tax_config_id" PRIMARY KEY ("id")
      )`,
    );

    // --- Seed data ---

    // Seed gateways
    await queryRunner.query(
      `INSERT INTO "tn_payment_gateways" ("slug", "label", "is_active") VALUES
        ('pago_nube', 'Pago Nube', true),
        ('mercado_pago', 'Mercado Pago', true),
        ('modo', 'MODO', false)`,
    );

    // Seed gateway rates — Pago Nube
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'tarjeta_debito_credito', 7, 4.39 FROM "tn_payment_gateways" WHERE "slug" = 'pago_nube'`,
    );
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'tarjeta_debito_credito', 14, 3.49 FROM "tn_payment_gateways" WHERE "slug" = 'pago_nube'`,
    );
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'billetera_virtual', 1, 6.09 FROM "tn_payment_gateways" WHERE "slug" = 'pago_nube'`,
    );
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'billetera_virtual', 7, 4.39 FROM "tn_payment_gateways" WHERE "slug" = 'pago_nube'`,
    );
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'billetera_virtual', 14, 3.49 FROM "tn_payment_gateways" WHERE "slug" = 'pago_nube'`,
    );
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'transferencia', 1, 1.50 FROM "tn_payment_gateways" WHERE "slug" = 'pago_nube'`,
    );

    // Seed gateway rates — Mercado Pago
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'todos_los_medios', 0, 6.29 FROM "tn_payment_gateways" WHERE "slug" = 'mercado_pago'`,
    );
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'todos_los_medios', 10, 4.39 FROM "tn_payment_gateways" WHERE "slug" = 'mercado_pago'`,
    );
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'todos_los_medios', 18, 3.39 FROM "tn_payment_gateways" WHERE "slug" = 'mercado_pago'`,
    );
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'todos_los_medios', 35, 1.49 FROM "tn_payment_gateways" WHERE "slug" = 'mercado_pago'`,
    );

    // Seed gateway rates — MODO
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'tarjeta_credito', 1, 7.11 FROM "tn_payment_gateways" WHERE "slug" = 'modo'`,
    );
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'tarjeta_credito', 8, 2.80 FROM "tn_payment_gateways" WHERE "slug" = 'modo'`,
    );
    await queryRunner.query(
      `INSERT INTO "tn_gateway_rates" ("gateway_id", "payment_method", "withdrawal_days", "rate_percent")
        SELECT id, 'tarjeta_debito', 1, 1.80 FROM "tn_payment_gateways" WHERE "slug" = 'modo'`,
    );

    // Seed installment rates
    await queryRunner.query(
      `INSERT INTO "tn_installment_rates" ("installments", "rate_percent") VALUES
        (1, 0.00),
        (3, 8.42),
        (6, 17.41),
        (9, 27.04),
        (12, 37.39)`,
    );

    // Seed tax config
    await queryRunner.query(
      `INSERT INTO "tn_tax_config" ("iva_rate", "iibb_rate") VALUES
        (21.00, 3.50)`,
    );

    // Seed plans
    await queryRunner.query(
      `INSERT INTO "tn_plans" ("slug", "label", "cpt_pago_nube", "cpt_other_gateways", "only_pago_nube", "is_active") VALUES
        ('inicial', 'Inicial', 0.00, 0.00, true, true),
        ('esencial', 'Esencial', 0.00, 2.00, false, true),
        ('impulso', 'Impulso', 0.00, 1.00, false, true),
        ('escala', 'Escala', 0.00, 0.70, false, true)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tn_gateway_rates_lookup"`,
    );
    await queryRunner.query(`DROP TABLE "tn_gateway_rates"`);
    await queryRunner.query(`DROP TABLE "tn_installment_rates"`);
    await queryRunner.query(`DROP TABLE "tn_tax_config"`);
    await queryRunner.query(`DROP TABLE "tn_payment_gateways"`);
    await queryRunner.query(`DROP TABLE "tn_plans"`);
  }
}

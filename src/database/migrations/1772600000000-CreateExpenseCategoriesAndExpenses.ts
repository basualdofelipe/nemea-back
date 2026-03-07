import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpenseCategoriesAndExpenses1772600000000 implements MigrationInterface {
  name = 'CreateExpenseCategoriesAndExpenses1772600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create expense_categories table
    await queryRunner.query(
      `CREATE TABLE "expense_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying(100) NOT NULL,
        CONSTRAINT "PK_expense_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_expense_categories_name" UNIQUE ("name")
      )`,
    );

    // Seed 6 default expense categories
    await queryRunner.query(
      `INSERT INTO "expense_categories" ("name") VALUES
        ('Materia prima'),
        ('Packaging'),
        ('Envio'),
        ('Herramientas'),
        ('Servicios'),
        ('Otros')`,
    );

    // Create expenses table
    await queryRunner.query(
      `CREATE TABLE "expenses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "amount" decimal(12,2) NOT NULL,
        "concept" character varying(500) NOT NULL,
        "date" DATE NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "PK_expenses_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_expenses_category" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id")
      )`,
    );

    // Index on date DESC for filter performance
    await queryRunner.query(
      `CREATE INDEX "IDX_expenses_date" ON "expenses" ("date" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_expenses_date"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TABLE "expense_categories"`);
  }
}

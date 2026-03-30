import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolesAndMigrateUsers1773000000000
  implements MigrationInterface
{
  name = 'CreateRolesAndMigrateUsers1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create roles table
    await queryRunner.query(
      `CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "is_system" boolean NOT NULL DEFAULT false,
        "can_view_products" boolean NOT NULL DEFAULT false,
        "can_edit_products" boolean NOT NULL DEFAULT false,
        "can_view_supplies" boolean NOT NULL DEFAULT false,
        "can_edit_supplies" boolean NOT NULL DEFAULT false,
        "can_view_expenses" boolean NOT NULL DEFAULT false,
        "can_edit_expenses" boolean NOT NULL DEFAULT false,
        "can_use_calculator" boolean NOT NULL DEFAULT false,
        "can_manage_scenarios" boolean NOT NULL DEFAULT false,
        "can_view_dashboard" boolean NOT NULL DEFAULT false,
        "can_manage_config" boolean NOT NULL DEFAULT false,
        "can_manage_users" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name")
      )`,
    );

    // 2. Seed ADMIN role with all permissions
    const adminResult: { id: string }[] = await queryRunner.query(
      `INSERT INTO "roles" (
        "name", "description", "is_system",
        "can_view_products", "can_edit_products",
        "can_view_supplies", "can_edit_supplies",
        "can_view_expenses", "can_edit_expenses",
        "can_use_calculator", "can_manage_scenarios",
        "can_view_dashboard", "can_manage_config", "can_manage_users"
      ) VALUES (
        'ADMIN', 'Administrador con acceso total', true,
        true, true, true, true, true, true, true, true, true, true, true
      ) RETURNING id`,
    );
    const adminRoleId = adminResult[0].id;

    // 3. Seed USER role with read-only + calculator + scenarios + dashboard
    const userResult: { id: string }[] = await queryRunner.query(
      `INSERT INTO "roles" (
        "name", "description", "is_system",
        "can_view_products", "can_edit_products",
        "can_view_supplies", "can_edit_supplies",
        "can_view_expenses", "can_edit_expenses",
        "can_use_calculator", "can_manage_scenarios",
        "can_view_dashboard", "can_manage_config", "can_manage_users"
      ) VALUES (
        'USER', 'Usuario con acceso de lectura', true,
        true, false, true, false, true, false, true, true, true, false, false
      ) RETURNING id`,
    );
    const userRoleId = userResult[0].id;

    // 4. Add role_id column to users (nullable initially)
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "role_id" uuid`,
    );

    // 5. Create index on role_id (AFTER column exists)
    await queryRunner.query(
      `CREATE INDEX "IDX_users_role_id" ON "users" ("role_id")`,
    );

    // 6. Migrate admin users
    await queryRunner.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role" = 'admin'`,
      [adminRoleId],
    );

    // 7. Migrate user-role users
    await queryRunner.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role" = 'user'`,
      [userRoleId],
    );

    // 8. Safety: assign any remaining users to USER role
    await queryRunner.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role_id" IS NULL`,
      [userRoleId],
    );

    // 9. Make role_id NOT NULL
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL`,
    );

    // 10. Add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id")`,
    );

    // 11. Drop old role column
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "role"`,
    );

    // 12. Drop old role enum type
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."users_role_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Add role column back as varchar
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "role" character varying(10) NOT NULL DEFAULT 'user'`,
    );

    // 2. Populate role from joined role name
    await queryRunner.query(
      `UPDATE "users" u SET "role" = LOWER(r."name")
       FROM "roles" r WHERE u."role_id" = r."id"`,
    );

    // 3. Drop FK constraint
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_role_id"`,
    );

    // 4. Drop index
    await queryRunner.query(
      `DROP INDEX "public"."IDX_users_role_id"`,
    );

    // 5. Drop role_id column
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "role_id"`,
    );

    // 6. Recreate enum type
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`,
    );

    // 7. Convert role column to enum
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"public"."users_role_enum"`,
    );

    // 8. Set default
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`,
    );

    // 9. Drop roles table
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolesAndMigrateUsers1773000000000 implements MigrationInterface {
  name = 'CreateRolesAndMigrateUsers1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Create roles table
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

    // Step 2: INSERT ADMIN role with all permissions = true
    const adminResult = await queryRunner.query(
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
    const adminRole = adminResult[0] as { id: string };

    // Step 3: INSERT USER role with read + calculator + scenarios permissions
    const userResult = await queryRunner.query(
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
    const userRole = userResult[0] as { id: string };

    // Step 4: Add role_id column to users (nullable initially)
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "role_id" uuid`);

    // Step 5: CREATE INDEX on role_id (AFTER the column exists)
    await queryRunner.query(
      `CREATE INDEX "IDX_users_role_id" ON "users" ("role_id")`,
    );

    // Step 6: UPDATE users with role = 'admin' to ADMIN role
    await queryRunner.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role" = 'admin'`,
      [adminRole.id],
    );

    // Step 7: UPDATE users with role = 'user' to USER role
    await queryRunner.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role" = 'user'`,
      [userRole.id],
    );

    // Step 8: Safety — ensure no users are left without a role
    await queryRunner.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role_id" IS NULL`,
      [userRole.id],
    );

    // Step 9: Make role_id NOT NULL
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL`,
    );

    // Step 10: Add FK constraint
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id")`,
    );

    // Step 11: Drop old role enum column
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);

    // Step 12: Drop old role enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate enum type
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM ('admin', 'user')`,
    );

    // Add role column back as varchar temporarily
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "role" character varying NOT NULL DEFAULT 'user'`,
    );

    // Populate role from role name
    await queryRunner.query(
      `UPDATE "users" u SET "role" = r."name" FROM "roles" r WHERE u."role_id" = r."id"`,
    );

    // Convert to lowercase for enum values
    await queryRunner.query(`UPDATE "users" SET "role" = LOWER("role")`);

    // Safety: remap any custom role names (e.g. 'inversor') to 'user' before casting.
    // Without this, the USING cast below would fail with "invalid input value for enum"
    // for any user assigned a role that does not map to 'admin' or 'user'.
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'user' WHERE "role" NOT IN ('admin', 'user')`,
    );

    // Convert varchar to enum
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"public"."users_role_enum"`,
    );

    // Drop index on role_id
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role_id"`);

    // Drop FK constraint
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_role_id"`,
    );

    // Drop role_id column
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role_id"`);

    // Drop roles table
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}

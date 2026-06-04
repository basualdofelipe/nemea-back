import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDemoUser1773200000000 implements MigrationInterface {
  name = 'SeedDemoUser1773200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const demoEmail = process.env.DEMO_EMAIL ?? 'demo@hefesto.com';
    const demoName = `Demo ${process.env.APP_NAME ?? 'Hefesto'}`;

    // Query for ADMIN role ID (not hardcoded — uuid was generated at migration time)
    const adminRoleResult = await queryRunner.query(
      `SELECT id FROM "roles" WHERE "name" = 'ADMIN' LIMIT 1`,
    );
    const adminRoleId = (adminRoleResult[0] as { id: string } | undefined)?.id;
    if (!adminRoleId) {
      throw new Error(
        'ADMIN role not found — run CreateRolesAndMigrateUsers1773000000000 first',
      );
    }

    await queryRunner.query(
      `INSERT INTO "users" ("email", "name", "is_active", "role_id")
       VALUES ($1, $2, true, $3)
       ON CONFLICT ("email") DO NOTHING`,
      [demoEmail, demoName, adminRoleId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [
      process.env.DEMO_EMAIL ?? 'demo@hefesto.com',
    ]);
  }
}

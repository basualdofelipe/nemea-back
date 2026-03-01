import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUsersIdToUuid1772380000000 implements MigrationInterface {
  name = 'AlterUsersIdToUuid1772380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension (required by TypeORM's uuid_generate_v4())
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Drop existing PK constraint on users table
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"`,
    );

    // Add temporary UUID column with generated default
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "new_id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );

    // Drop old integer id column
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);

    // Rename new_id to id
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "new_id" TO "id"`,
    );

    // Recreate PK constraint
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "PK_users_id" PRIMARY KEY ("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop UUID PK constraint
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "PK_users_id"`,
    );

    // Drop UUID id column
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);

    // Recreate integer id column with SERIAL
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "id" SERIAL NOT NULL`,
    );

    // Recreate original PK constraint
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")`,
    );
  }
}

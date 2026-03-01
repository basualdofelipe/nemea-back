import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1772369233961 implements MigrationInterface {
  name = 'CreateUserTable1772369233961';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "name" character varying(255), "picture_url" character varying(500), "google_id" character varying(50), "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "users" ("email", "role", "name", "is_active") VALUES ('admin@nemea.com', 'admin', 'Admin Nemea', true)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}

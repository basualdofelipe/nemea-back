/**
 * E2E Test Setup
 *
 * Overrides DATABASE_URL to point to the test database (port 5433)
 * before any test modules are loaded.
 *
 * Requires: docker compose up -d (postgres-test on port 5433)
 */
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgresql://nemea:nemea_test@localhost:5433/nemea_test';
process.env.NODE_ENV = 'test';

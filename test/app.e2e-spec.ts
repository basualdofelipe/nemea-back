import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import helmet from 'helmet';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { LoggingInterceptor } from './../src/common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mirror main.ts configuration
    app.setGlobalPrefix('api');
    app.use(helmet());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
      new ResponseInterceptor(),
      new LoggingInterceptor(),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/health', () => {
    it('should return 200 with health status (public route)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.status).toBe('ok');
    });

    it('should return correct response shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      const { data } = response.body;
      expect(data).toEqual(
        expect.objectContaining({
          status: 'ok',
          app: 'hefesto-back',
          version: '0.1.0',
        }),
      );
      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThan(0);
    });

    it('should include Content-Security-Policy header from helmet', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Auth guard behavior', () => {
    it('GET /api/auth/me should return 401 without JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('GET /api/auth/me with invalid JWT should return 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('GET /api/users should return 401 without JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('POST /api/users should return 401 without JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({ email: 'test@hefesto.com' })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('DELETE /api/users/1 should return 401 without JWT', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/users/1')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('POST /api/auth/google without body should return 400 (ValidationPipe)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/google')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('unknown route should return 404 with correct error format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});

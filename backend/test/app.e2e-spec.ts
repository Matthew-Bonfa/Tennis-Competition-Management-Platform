import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    // Adds stricter formatting to tests
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Logins for proper token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@tennis.com',
        password: 'password123',
      })
      .expect(200);

    adminToken = loginResponse.body.access_token;
  });

  it('/api/health (GET) -> should return 200 OK', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Verifies the endpoint returns a valid response
    expect(response.status).toBe(200);
  });
});

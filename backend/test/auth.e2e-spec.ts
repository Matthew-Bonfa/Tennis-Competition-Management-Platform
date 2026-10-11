import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Auth Feature (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  // Working login
  it('POST /api/auth/login -> should return 200 and a JWT for valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@tennis.com',
        password: 'password123', // Matches the bcrypt.hash in the seeder
      })
      .expect(200);

    // Verify the response contains the expected structure
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('personId');

    // Verify it correctly extracted the roles
    expect(Array.isArray(response.body.roles)).toBeTruthy();
    expect(response.body.roles).toContain('ASSOCIATION_ADMIN');
  });

  // Wrong password
  it('POST /api/auth/login -> should return 401 Unauthorized for incorrect password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@tennis.com',
        password: 'wrongpassword',
      })
      .expect(401);
  });

  // Email doesn't exist
  it('POST /api/auth/login -> should return 401 Unauthorized for unknown email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'nobody@tennis.com',
        password: 'password123',
      })
      .expect(401);
  });
});

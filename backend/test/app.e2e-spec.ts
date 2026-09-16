import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 1. Add the global prefix so routes match production
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/health (GET) -> should return 200 OK', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    // Verifies the endpoint returns a valid response
    expect(response.status).toBe(200);
  });
});

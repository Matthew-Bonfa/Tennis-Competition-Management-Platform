import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Teams Feature (e2e)', () => {
  let app: INestApplication;

  // 1. Setup Phase: Spin up the entire NestJS application before running tests
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Loads your entire app (Controllers, Services, Prisma)
    }).compile();

    app = moduleFixture.createNestApplication();

    // IMPORTANT: Apply the same global prefix you use in your main.ts!
    app.setGlobalPrefix('api');

    await app.init();
  });

  // 2. Teardown Phase: Close the app and database connections when finished
  afterAll(async () => {
    await app.close();
  });

  // =========================================================
  // THE TESTS
  // =========================================================

  it('GET /api/teams -> should return an array of teams', async () => {
    // Use Supertest to fire a fake HTTP GET request
    const response = await request(app.getHttpServer())
      .get('/api/teams')
      .expect(200); // Asserts that we get an HTTP 200 OK status

    // Vitest assertions to check the actual data returned
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    // Because we used .include('club') in the service, we can verify relationships work
    expect(response.body[0]).toHaveProperty('club');
  });

  it('GET /api/teams/1 -> should return the Kilsyth A team with its roster', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/teams/1')
      .expect(200);

    // Verify the specific record
    expect(response.body.name).toBe('Kilsyth A');

    // Verify the deeply nested player roster from our database join
    expect(response.body).toHaveProperty('players');
    expect(Array.isArray(response.body.players)).toBeTruthy();
  });

  it('GET /api/teams/9999 -> should return a 404 Not Found for missing IDs', async () => {
    // This proves our NotFoundException in the service works correctly!
    await request(app.getHttpServer()).get('/api/teams/9999').expect(404);
  });
});

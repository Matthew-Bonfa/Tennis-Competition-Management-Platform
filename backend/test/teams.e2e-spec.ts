import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Teams Feature (e2e)', () => {
  let app: INestApplication;

  // Sets everything up
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

  // Close connection after testing is finished
  afterAll(async () => {
    await app.close();
  });

  // Actual end to end tests

  it('GET /api/teams -> should return an array of teams', async () => {
    // End point is active
    const response = await request(app.getHttpServer())
      .get('/api/teams')
      .expect(200);

    // Checks for a non empty array
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    // Checks if
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

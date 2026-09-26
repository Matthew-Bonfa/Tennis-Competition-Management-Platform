import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Sections Feature (e2e)', () => {
  let app: INestApplication;

  // Setup
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  // Close
  afterAll(async () => {
    await app.close();
  });

  // Test existance
  it('GET /api/sections/1/ladder -> should return the calculated ladder for Section 1', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/sections/1/ladder')
      .expect(200);

    // Checks for non empty array
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body).toBeGreaterThan(0);

    // Ensures the types line up
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          teamId: expect.any(Number),
          teamName: expect.any(String),
          matchesPlayed: expect.any(Number),
          points: expect.any(Number),
        }),
      ]),
    );
  });

  // Ensures we should get a 404 if id does not exist
  it('GET /api/sections/9999/ladder -> should handle missing sections gracefully', async () => {
    await request(app.getHttpServer())
      .get('/api/sections/9999/ladder')
      .expect(404);
  });
});

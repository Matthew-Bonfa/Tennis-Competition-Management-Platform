import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Clubs Feature (e2e)', () => {
  let app: INestApplication;

  // Variable for testing
  let savedClubId: string;

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

  // Summary data of all clubs
  it('GET /api/clubs -> should return a summary list of all clubs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/clubs')
      .expect(200);

    // Non empty array should be returned
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    // Verifies the body is of the correct type
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        isFinancialMember: expect.any(Boolean),
        teamCount: expect.any(Number),
        memberCount: expect.any(Number),
      }),
    );

    // Save uuid for the next test
    savedClubId = response.body[0].id;
  });

  // All data for a specific club
  it('GET /api/clubs/:id -> should return full details for a specific club', async () => {
    expect(savedClubId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/clubs/${savedClubId}`)
      .expect(200);

    // Verifies the body is of the correct type
    expect(response.body).toEqual(
      expect.objectContaining({
        id: savedClubId,
        name: expect.any(String),
        teams: expect.any(Array),
      }),
    );
  });

  // Testing correct error response to invalid id
  it('GET /api/clubs/:id -> should return 404 Not Found for a non-existent UUID', async () => {
    // uuid not in the db
    const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

    const response = await request(app.getHttpServer())
      .get(`/api/clubs/${fakeUuid}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });
});

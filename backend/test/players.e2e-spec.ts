import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Players Feature (e2e)', () => {
  let app: INestApplication;

  // Saved from the list test for reuse in the detail/record tests below.
  let savedPlayerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Summary list of players (search page)
  it('GET /api/players -> should return a summary list of players', async () => {
    const response = await request(app.getHttpServer()).get('/api/players').expect(200);

    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        personCode: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
      }),
    );

    savedPlayerId = response.body[0].id;
  });

  // Search narrows the list
  it('GET /api/players?search= -> should filter players by name', async () => {
    expect(savedPlayerId).toBeDefined();

    const all = await request(app.getHttpServer()).get('/api/players').expect(200);
    const target = all.body.find((p: any) => p.id === savedPlayerId);

    const response = await request(app.getHttpServer())
      .get(`/api/players?search=${encodeURIComponent(target.firstName)}`)
      .expect(200);

    expect(response.body.some((p: any) => p.id === savedPlayerId)).toBe(true);
  });

  // Full profile for a specific player
  it('GET /api/players/:id -> should return full details for a specific player', async () => {
    expect(savedPlayerId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/players/${savedPlayerId}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: savedPlayerId,
        firstName: expect.any(String),
        lastName: expect.any(String),
        clubs: expect.any(Array),
        competitions: expect.any(Array),
      }),
    );
  });

  // 404 for a player that doesn't exist
  it('GET /api/players/:id -> should return 404 Not Found for a non-existent UUID', async () => {
    const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

    const response = await request(app.getHttpServer())
      .get(`/api/players/${fakeUuid}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  // Win/loss record, bucketed by year and rubber type
  it('GET /api/players/:id/record -> should return a bucketed win/loss record', async () => {
    expect(savedPlayerId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/players/${savedPlayerId}/record`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        buckets: expect.any(Array),
        years: expect.any(Array),
        rubberTypes: expect.any(Array),
      }),
    );
  });

  // 404 for the record endpoint too, not just the profile
  it('GET /api/players/:id/record -> should return 404 Not Found for a non-existent UUID', async () => {
    const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

    const response = await request(app.getHttpServer())
      .get(`/api/players/${fakeUuid}/record`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  // Editing a player's own identity fields
  describe('PATCH /api/players/:id', () => {
    it('updates the supplied fields and returns the full profile', async () => {
      expect(savedPlayerId).toBeDefined();

      const before = await request(app.getHttpServer()).get(`/api/players/${savedPlayerId}`).expect(200);
      const originalPhone = before.body.phone;

      const response = await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .send({ phone: '0400 123 456' })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: savedPlayerId,
          phone: '0400 123 456',
          firstName: before.body.firstName,
          lastName: before.body.lastName,
        }),
      );

      await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .send({ phone: originalPhone })
        .expect(200);
    });

    it('returns 404 Not Found for a non-existent UUID', async () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .patch(`/api/players/${fakeUuid}`)
        .send({ phone: '0400 000 000' })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('returns 400 Bad Request for a field that is not editable', async () => {
      expect(savedPlayerId).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .send({ personCode: 'P999' })
        .expect(400);
    });

    it('returns 400 Bad Request for an invalid email', async () => {
      expect(savedPlayerId).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('returns 400 Bad Request for a null non-nullable field', async () => {
      expect(savedPlayerId).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .send({ firstName: null })
        .expect(400);
    });

    it('returns 400 Bad Request for an empty body', async () => {
      expect(savedPlayerId).toBeDefined();

      await request(app.getHttpServer()).patch(`/api/players/${savedPlayerId}`).send({}).expect(400);
    });
  });
});

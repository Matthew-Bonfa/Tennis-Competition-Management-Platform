// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Competitions Feature (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  // Saved from the list test for reuse in the detail and filter tests below.
  let savedCompetitionId: string;
  let savedAssociationId: string

  // Saved from the create test, so the update tests change a competition that this file made itself, not a seeded one.
  let createdCompetitionId: string;

  // Unique per run, since the create tests add rows to the database.
  const createdName = `E2E Competition ${Date.now()}`;
  const renamedName = `${createdName} Renamed`;

  const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

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

    // Logins for proper token (only the create and update endpoints need it)
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@tennis.com',
        password: 'password123',
      })
      .expect(200);

    adminToken = loginResponse.body.access_token;
  });

  // Close connection after testing is finished
  afterAll(async () => {
    await app.close();
  });

  // Actual end to end tests -----------------------------------------------------------

  // Reading competitions (public, so no token) --------------------------------------

  // for findAll()
  it('GET /api/competitions -> should return an array of competitions', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/competitions')
      .expect(200);

    // Checks for a non empty array
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    // Checks the first competition has the right shape
    expect(response.body[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      association: expect.anything(),
    });

    // dayOfWeek and startTime are optional, so they may be null:
    // only check they are part of the response
    expect(response.body[0]).toHaveProperty('dayOfWeek');
    expect(response.body[0]).toHaveProperty('startTime');

    savedCompetitionId = response.body[0].id;
    savedAssociationId = response.body[0].association.id;
  });

  // Filtering by association (what the dropdown on the Competitions page uses)
  it('GET /api/competitions?associationId= -> should only return that association\'s competitions', async () => {
    expect(savedAssociationId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/competitions?associationId=${savedAssociationId}`)
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every((c: any) => c.association?.id === savedAssociationId),
    ).toBe(true);
    expect(response.body.some((c: any) => c.id === savedCompetitionId)).toBe(true);
  });

  it('GET /api/competitions?associationId= -> should return an empty list for an association with no competitions', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/competitions?associationId=${fakeUuid}`)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  // for findOne()
  it('GET /api/competitions/:id -> should return the competition with its association and seasons', async () => {
    expect(savedCompetitionId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/competitions/${savedCompetitionId}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: savedCompetitionId,
      name: expect.any(String),
      association: {
        id: savedAssociationId,
        name: expect.any(String),
      },
      seasons: expect.any(Array),
    });
    expect(response.body).toHaveProperty('dayOfWeek');
    expect(response.body).toHaveProperty('startTime');
  });

  // 404 for a competition that doesn't exist
  it('GET /api/competitions/:id -> should return 404 Not Found for a non-existent UUID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/competitions/${fakeUuid}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  // Creating a competition (needs the admin token) ----------------------------------
  describe('POST /api/competitions', () => {
    it('creates a competition with just a name and an association', async () => {
      expect(savedAssociationId).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/api/competitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: createdName, associationId: savedAssociationId })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: createdName,
        associationId: savedAssociationId,
        dayOfWeek: null,
        startTime: null,
      });

      createdCompetitionId = response.body.id;
    });

    it('creates a competition with a day of the week and a start time', async () => {
      expect(savedAssociationId).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/api/competitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `${createdName} with schedule`,
          associationId: savedAssociationId,
          dayOfWeek: 'friday',
          startTime: '18:30',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        dayOfWeek: 'friday',
        startTime: '18:30',
      });
    });

    it('shows the new competition when it is read back', async () => {
      expect(createdCompetitionId).toBeDefined();

      const response = await request(app.getHttpServer())
        .get(`/api/competitions/${createdCompetitionId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdCompetitionId,
        name: createdName,
        association: { id: savedAssociationId },
        seasons: [],
      });
    });

    it('returns 400 Bad Request when the name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/competitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ associationId: savedAssociationId })
        .expect(400);
    });

    it('returns 400 Bad Request when the name is blank', async () => {
      await request(app.getHttpServer())
        .post('/api/competitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', associationId: savedAssociationId })
        .expect(400);
    });

    it('returns 400 Bad Request when the association is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/competitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: createdName })
        .expect(400);
    });
  });

  // Editing a competition (needs the admin token) -----------------------------------
  describe('PATCH /api/competitions/:id', () => {
    it('changes the name and returns the updated competition', async () => {
      expect(createdCompetitionId).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/competitions/${createdCompetitionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: renamedName })
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdCompetitionId,
        name: renamedName,
        associationId: savedAssociationId,
      });
    });

    it('has saved the new name', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/competitions/${createdCompetitionId}`)
        .expect(200);

      expect(response.body.name).toBe(renamedName);
    });

    it('sets a day of the week and a start time', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/competitions/${createdCompetitionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dayOfWeek: 'monday', startTime: '09:30' })
        .expect(200);

      expect(response.body).toMatchObject({
        name: renamedName,
        dayOfWeek: 'monday',
        startTime: '09:30',
      });
    });

    it('clears the day and start time when they are set to null', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/competitions/${createdCompetitionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dayOfWeek: null, startTime: null })
        .expect(200);

      expect(response.body).toMatchObject({
        dayOfWeek: null,
        startTime: null,
      });
    });

    it('returns 404 Not Found for a non-existent UUID', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/competitions/${fakeUuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: renamedName })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('returns 400 Bad Request for an empty body', async () => {
      await request(app.getHttpServer())
        .patch(`/api/competitions/${createdCompetitionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  // Create and update require admin access (reads are public)
  describe('Unauthorized Access', () => {
    it('POST /api/competitions -> should return 401 Unauthorized when no token is provided', async () => {
      expect(savedAssociationId).toBeDefined();

      await request(app.getHttpServer())
        .post('/api/competitions')
        .send({ name: createdName, associationId: savedAssociationId })
        .expect(401);
    });

    it('PATCH /api/competitions/:id -> should return 401 Unauthorized when no token is provided', async () => {
      expect(createdCompetitionId).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/competitions/${createdCompetitionId}`)
        .send({ name: renamedName })
        .expect(401);
    });
  });
});
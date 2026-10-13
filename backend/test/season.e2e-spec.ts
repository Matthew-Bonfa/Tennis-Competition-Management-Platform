// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Seasons Feature (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  // The competition this file creates for itself, so the seasons it adds
  // never end up under a seeded competition.
  let competitionId: string;

  // Saved from the read tests: the seeded season "Summer 2026/27".
  let seededSeason: any;

  // Saved from the create test, so the update tests change a season that
  // this file made itself, not a seeded one.
  let createdSeasonId: number;

  // Unique per run, since the create tests add rows to the database.
  const createdName = `E2E Season ${Date.now()}`;
  const renamedName = `${createdName} Renamed`;

  const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

  // A valid season body, for the tests that change one thing about it.
  const validBody = () => ({
    name: createdName,
    competitionId,
    startDate: '2027-01-10',
    endDate: '2027-03-28',
  });

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

    // A season belongs to a competition, which belongs to an association
    const associations = await request(app.getHttpServer())
      .get('/api/associations')
      .expect(200);

    const competition = await request(app.getHttpServer())
      .post('/api/competitions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `E2E Competition for seasons ${Date.now()}`,
        associationId: associations.body[0].id,
      })
      .expect(201);

    competitionId = competition.body.id;
  });

  // Close connection after testing is finished
  afterAll(async () => {
    await app.close();
  });

  // Actual end to end tests -----------------------------------------------------------

  // Reading seasons (public, so no token) --------------------------------------------

  // for findAll()
  it('GET /api/seasons -> should return an array of seasons', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/seasons')
      .expect(200);

    // Checks for a non empty array
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    // Checks the first season has the right shape
    expect(response.body[0]).toMatchObject({
      id: expect.any(Number),
      competitionId: expect.any(String),
      name: expect.any(String),
      startDate: expect.any(String),
      endDate: expect.any(String),
    });
  });

  it('GET /api/seasons -> should include the seeded Summer 2026/27 season', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/seasons')
      .expect(200);

    seededSeason = response.body.find((s: any) => s.name === 'Summer 2026/27');

    expect(seededSeason).toBeDefined();
    expect(seededSeason.startDate).toContain('2026-10-03');
  });

  // Filtering by competition (what the Manage Competition page uses)
  it('GET /api/seasons?competitionId= -> should only return that competition\'s seasons', async () => {
    expect(seededSeason).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/seasons?competitionId=${seededSeason.competitionId}`)
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every((s: any) => s.competitionId === seededSeason.competitionId),
    ).toBe(true);
    expect(response.body.some((s: any) => s.id === seededSeason.id)).toBe(true);
  });

  it('GET /api/seasons?competitionId= -> should return an empty list for a competition with no seasons', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/seasons?competitionId=${fakeUuid}`)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  // for findOne()
  it('GET /api/seasons/:id -> should return one season', async () => {
    expect(seededSeason).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/seasons/${seededSeason.id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: seededSeason.id,
      name: 'Summer 2026/27',
      competitionId: seededSeason.competitionId,
    });
  });

  // 404 for a season that doesn't exist
  it('GET /api/seasons/9999999 -> should return a 404 Not Found for missing IDs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/seasons/9999999')
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  it('GET /api/seasons/abc -> should return a 400 Bad Request for a non-numeric ID', async () => {
    // ParseIntPipe rejects a non-numeric :id before it ever reaches the service.
    await request(app.getHttpServer()).get('/api/seasons/abc').expect(400);
  });

  // Creating a season (needs the admin token) ----------------------------------------
  describe('POST /api/seasons', () => {
    it('creates a season in the competition', async () => {
      expect(competitionId).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/api/seasons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validBody())
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: createdName,
        competitionId,
        startDate: expect.stringContaining('2027-01-10'),
        endDate: expect.stringContaining('2027-03-28'),
      });

      createdSeasonId = response.body.id;
    });

    it('shows the new season when its competition\'s seasons are listed', async () => {
      expect(createdSeasonId).toBeDefined();

      const response = await request(app.getHttpServer())
        .get(`/api/seasons?competitionId=${competitionId}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdSeasonId, name: createdName }),
        ]),
      );
    });

    it('returns 400 Bad Request when the name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/seasons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ competitionId, startDate: '2027-01-10', endDate: '2027-03-28' })
        .expect(400);
    });

    it('returns 400 Bad Request when the competition is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/seasons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: createdName, startDate: '2027-01-10', endDate: '2027-03-28' })
        .expect(400);
    });

    it('returns 400 Bad Request when the start date is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/seasons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: createdName, competitionId, endDate: '2027-03-28' })
        .expect(400);
    });

    it('returns 400 Bad Request when the end date is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/seasons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: createdName, competitionId, startDate: '2027-01-10' })
        .expect(400);
    });

    it('returns 400 Bad Request when the name is blank', async () => {
      await request(app.getHttpServer())
        .post('/api/seasons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody(), name: '' })
        .expect(400);
    });

    it('returns 400 Bad Request when a date is not a valid date', async () => {
      await request(app.getHttpServer())
        .post('/api/seasons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody(), startDate: 'not-a-date' })
        .expect(400);
    });

    it('returns 400 Bad Request for a field that is not part of a season', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/seasons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validBody(), colour: 'green' })
        .expect(400);

      expect(response.body.message).toContain('property colour should not exist');
    });
  });

  // Editing a season (needs the admin token) -----------------------------------------
  describe('PATCH /api/seasons/:id', () => {
    it('changes the name and end date but not the start date', async () => {
      expect(createdSeasonId).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/api/seasons/${createdSeasonId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: renamedName, endDate: '2027-04-04' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdSeasonId,
        name: renamedName,
        competitionId,
        startDate: expect.stringContaining('2027-01-10'),
        endDate: expect.stringContaining('2027-04-04'),
      });
    });

    it('has saved the changes', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/seasons/${createdSeasonId}`)
        .expect(200);

      expect(response.body.name).toBe(renamedName);
      expect(response.body.endDate).toContain('2027-04-04');
    });

    it('returns 404 Not Found for a season that does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/seasons/9999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: renamedName })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('returns 400 Bad Request for a non-numeric ID', async () => {
      await request(app.getHttpServer())
        .patch('/api/seasons/abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: renamedName })
        .expect(400);
    });

    it('returns 400 Bad Request when trying to move it to another competition', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/seasons/${createdSeasonId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ competitionId })
        .expect(400);

      expect(response.body.message).toContain(
        'property competitionId should not exist',
      );
    });

    it('returns 400 Bad Request when a date is not a valid date', async () => {
      await request(app.getHttpServer())
        .patch(`/api/seasons/${createdSeasonId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ endDate: 'not-a-date' })
        .expect(400);
    });

    it('returns 400 Bad Request for an empty body', async () => {
      await request(app.getHttpServer())
        .patch(`/api/seasons/${createdSeasonId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  // Create and update require admin access (reads are public)
  describe('Unauthorized Access', () => {
    it('POST /api/seasons -> should return 401 Unauthorized when no token is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/seasons')
        .send(validBody())
        .expect(401);
    });

    it('PATCH /api/seasons/:id -> should return 401 Unauthorized when no token is provided', async () => {
      expect(createdSeasonId).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/seasons/${createdSeasonId}`)
        .send({ name: renamedName })
        .expect(401);
    });
  });
});
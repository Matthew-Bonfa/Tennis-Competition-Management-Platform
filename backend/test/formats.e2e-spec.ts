import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Formats Feature (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let clubAdminToken: string;

  // A format id taken reused by the detail tests
  let savedFormatId: string;

  const validFormat = {
    minPlayers: 2,
    maxPlayers: 4,
    setsToWin: 2,
    gamesPerSet: 6,
    tiebreakAtGames: 6,
    winnerDeterminedBy: 'rubbers_then_sets',
    minCourts: 1,
    permittedGenders: ['boys', 'open'],
    rubbers: ['singles', 'singles', 'doubles'],
  };

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

    // Association admin, allowed to create formats
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@tennis.com',
        password: 'password123',
      })
      .expect(200);

    adminToken = adminLogin.body.access_token;

    // Club admin, authenticated but not allowed to create formats
    const clubLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'club@tennis.com',
        password: 'password123',
      })
      .expect(200);

    clubAdminToken = clubLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  // Public list of formats, used to fill dropdowns
  it('GET /api/formats -> should return a summary list of every format', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/formats')
      .expect(200);

    // The seeded database has formats so the list should not be empty
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    // Summary rows are only an id and a name, and must not leak the detail
    expect(response.body[0]).toEqual({
      id: expect.any(String),
      name: expect.any(String),
    });

    // Save a uuid for the detail tests below
    savedFormatId = response.body[0].id;
  });

  // Full detail for one format, with rubbers and permitted genders
  it('GET /api/formats/:id -> should return the full detail for one format', async () => {
    expect(savedFormatId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/formats/${savedFormatId}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: savedFormatId,
        name: expect.any(String),
        minPlayers: expect.any(Number),
        maxPlayers: expect.any(Number),
        setsToWin: expect.any(Number),
        gamesPerSet: expect.any(Number),
        winnerDeterminedBy: expect.any(String),
        minCourts: expect.any(Number),
        rubbers: expect.any(Array),
        permittedGenders: expect.any(Array),
      }),
    );

    // Rubbers come back in score-sheet order, numbered from 1
    expect(response.body.rubbers.length).toBeGreaterThan(0);
    expect(response.body.rubbers[0]).toEqual({
      rubberNumber: 1,
      rubberType: expect.any(String),
    });

    const numbers = response.body.rubbers.map(
      (rubber: any) => rubber.rubberNumber,
    );
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));

    // Permitted genders are plain strings, one per eligible gender
    expect(response.body.permittedGenders.length).toBeGreaterThan(0);
    expect(response.body.permittedGenders).toEqual(
      expect.arrayContaining([expect.any(String)]),
    );
  });

  // A uuid that is not in the database
  it('GET /api/formats/:id -> should return 404 for a uuid that does not exist', async () => {
    const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

    const response = await request(app.getHttpServer())
      .get(`/api/formats/${fakeUuid}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  // ParseUUIDPipe rejects anything that is not a uuid before it reaches the service
  it('GET /api/formats/:id -> should return 400 for an id that is not a uuid', async () => {
    await request(app.getHttpServer())
      .get('/api/formats/not-a-uuid')
      .expect(400);
  });

  // An association admin can create a format
  it('POST /api/formats -> should create a format and return 201 Created', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send(validFormat)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        minPlayers: validFormat.minPlayers,
        maxPlayers: validFormat.maxPlayers,
        setsToWin: validFormat.setsToWin,
        gamesPerSet: validFormat.gamesPerSet,
        tiebreakAtGames: validFormat.tiebreakAtGames,
        winnerDeterminedBy: validFormat.winnerDeterminedBy,
        minCourts: validFormat.minCourts,
        permittedGenders: validFormat.permittedGenders,
      }),
    );

    // The name is generated from the rubbers, never supplied by the caller
    expect(response.body.name).toBe('Single, Single, Double');

    // Rubbers are stored in the order they were sent, numbered from 1
    expect(response.body.rubbers).toEqual([
      { rubberNumber: 1, rubberType: 'singles' },
      { rubberNumber: 2, rubberType: 'singles' },
      { rubberNumber: 3, rubberType: 'doubles' },
    ]);

    // Optional fields left out of the body fall back to their defaults
    expect(response.body.minAge).toBeNull();
    expect(response.body.maxAge).toBeNull();
    expect(response.body.finalSetMatchTiebreak).toBe(false);
    expect(response.body.pointsPerRubber).toBe(1);
    expect(response.body.pointsPerMatchWin).toBe(0);
    expect(response.body.forfeitScoreline).toBe('6-0 6-0');
  });

  // The optional age bracket should round-trip when it is supplied
  it('POST /api/formats -> should keep the optional age bracket when it is supplied', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ ...validFormat, minAge: 12, maxAge: 18 })
      .expect(201);

    expect(response.body.minAge).toBe(12);
    expect(response.body.maxAge).toBe(18);
  });

  // A created format is immediately readable back through the detail endpoint
  it('GET /api/formats/:id -> should return a format created by POST', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ ...validFormat, rubbers: ['mixed_doubles', 'mixed_doubles'] })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/api/formats/${created.body.id}`)
      .expect(200);

    expect(response.body.id).toBe(created.body.id);
    expect(response.body.name).toBe('Mixed Double, Mixed Double');
    expect(response.body.rubbers).toEqual([
      { rubberNumber: 1, rubberType: 'mixed_doubles' },
      { rubberNumber: 2, rubberType: 'mixed_doubles' },
    ]);
  });

  // Creating a format needs authentication
  it('POST /api/formats -> should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .post('/api/formats')
      .send(validFormat)
      .expect(401);
  });

  // A club admin is authenticated but does not hold ASSOCIATION_ADMIN
  it('POST /api/formats -> should return 403 for a user without the ASSOCIATION_ADMIN role', async () => {
    await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${clubAdminToken}`)
      .send(validFormat)
      .expect(403);
  });

  // maxPlayers below minPlayers is rejected by the service
  it('POST /api/formats -> should return 400 when maxPlayers is less than minPlayers', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ ...validFormat, minPlayers: 4, maxPlayers: 2 })
      .expect(400);

    expect(response.body.message).toContain(
      'maxPlayers cannot be less than minPlayers',
    );
  });

  // maxAge below minAge is rejected by the service
  it('POST /api/formats -> should return 400 when maxAge is less than minAge', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ ...validFormat, minAge: 18, maxAge: 12 })
      .expect(400);

    expect(response.body.message).toContain(
      'maxAge cannot be less than minAge',
    );
  });

  // An unknown rubber type is rejected by the DTO validation
  it('POST /api/formats -> should return 400 for an unknown rubber type', async () => {
    await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ ...validFormat, rubbers: ['triples'] })
      .expect(400);
  });

  // A format with no rubbers would have no name and no score sheet
  it('POST /api/formats -> should return 400 when the rubbers list is empty', async () => {
    await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ ...validFormat, rubbers: [] })
      .expect(400);
  });

  // At least one gender must be able to enter
  it('POST /api/formats -> should return 400 when no permitted gender is given', async () => {
    await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ ...validFormat, permittedGenders: [] })
      .expect(400);
  });

  // Duplicated genders are rejected rather than silently stored twice
  it('POST /api/formats -> should return 400 when a gender is repeated', async () => {
    await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ ...validFormat, permittedGenders: ['open', 'open'] })
      .expect(400);
  });

  // A missing required field is rejected by the DTO validation
  it('POST /api/formats -> should return 400 when a required field is missing', async () => {
    const missingGamesPerSet: Partial<typeof validFormat> = { ...validFormat };
    delete missingGamesPerSet.gamesPerSet;

    await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send(missingGamesPerSet)
      .expect(400);
  });

  // An unknown winner rule is rejected by the DTO validation
  it('POST /api/formats -> should return 400 for an unknown winnerDeterminedBy value', async () => {
    await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ ...validFormat, winnerDeterminedBy: 'coin_toss' })
      .expect(400);
  });

  // Deleting a format that nothing uses removes it, its rubbers and its genders
  it('DELETE /api/formats/:id -> should delete an unused format and return 204', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send(validFormat)
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/formats/${created.body.id}`)
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .expect(204);

    // It is gone from the detail endpoint and from the list
    await request(app.getHttpServer())
      .get(`/api/formats/${created.body.id}`)
      .expect(404);

    const list = await request(app.getHttpServer()).get('/api/formats').expect(200);
    const ids = list.body.map((format: any) => format.id);
    expect(ids).not.toContain(created.body.id);
  });

  // A format used by a section must be kept
  it('DELETE /api/formats/:id -> should return 409 when a section uses the format', async () => {
    // Section 1 is seeded, so its format is guaranteed to be in use
    const section = await request(app.getHttpServer())
      .get('/api/sections/1')
      .expect(200);

    const response = await request(app.getHttpServer())
      .delete(`/api/formats/${section.body.formatId}`)
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .expect(409);

    expect(response.body.message).toContain('in use');

    // The format must still exist after the rejected delete
    await request(app.getHttpServer())
      .get(`/api/formats/${section.body.formatId}`)
      .expect(200);
  });

  // A uuid that is not in the database
  it('DELETE /api/formats/:id -> should return 404 for a uuid that does not exist', async () => {
    const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

    const response = await request(app.getHttpServer())
      .delete(`/api/formats/${fakeUuid}`)
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  // ParseUUIDPipe rejects anything that is not a uuid
  it('DELETE /api/formats/:id -> should return 400 for an id that is not a uuid', async () => {
    await request(app.getHttpServer())
      .delete('/api/formats/not-a-uuid')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .expect(400);
  });

  // Deleting a format needs authentication
  it('DELETE /api/formats/:id -> should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .delete(`/api/formats/${savedFormatId}`)
      .expect(401);
  });

  // A club admin is authenticated but does not hold ASSOCIATION_ADMIN
  it('DELETE /api/formats/:id -> should return 403 for a user without the ASSOCIATION_ADMIN role', async () => {
    // Use a throwaway format so a broken guard can't delete a seeded one
    const created = await request(app.getHttpServer())
      .post('/api/formats')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send(validFormat)
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/formats/${created.body.id}`)
      .set('AUTHORIZATION', `Bearer ${clubAdminToken}`)
      .expect(403);

    // Clean up
    await request(app.getHttpServer())
      .delete(`/api/formats/${created.body.id}`)
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .expect(204);
  });
});

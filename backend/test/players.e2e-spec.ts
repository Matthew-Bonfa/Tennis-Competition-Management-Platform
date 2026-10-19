import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Players Feature (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  // Saved from the list test for reuse in the detail/record tests below.
  let savedPlayerId: string;

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

    prisma = app.get(PrismaService);

    // Logins for proper token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@tennis.com',
        password: 'password123',
      })
      .expect(200);

    adminToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  // Summary list of players (search page)
  it('GET /api/players -> should return a summary list of players', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/players')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

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

    const all = await request(app.getHttpServer())
      .get('/api/players')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const target = all.body.find((p: any) => p.id === savedPlayerId);

    const response = await request(app.getHttpServer())
      .get(`/api/players?search=${encodeURIComponent(target.firstName)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.some((p: any) => p.id === savedPlayerId)).toBe(true);
  });

  // Full profile for a specific player
  it('GET /api/players/:id -> should return full details for a specific player', async () => {
    expect(savedPlayerId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/players/${savedPlayerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
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
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  // Win/loss record, bucketed by year and rubber type
  it('GET /api/players/:id/record -> should return a bucketed win/loss record', async () => {
    expect(savedPlayerId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/players/${savedPlayerId}/record`)
      .set('Authorization', `Bearer ${adminToken}`)
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
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  // Editing a player's own identity fields
  describe('PATCH /api/players/:id', () => {
    it('updates the supplied fields and returns the full profile', async () => {
      expect(savedPlayerId).toBeDefined();

      const before = await request(app.getHttpServer())
        .get(`/api/players/${savedPlayerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const originalPhone = before.body.phone;

      const response = await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
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
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: originalPhone })
        .expect(200);
    });

    it('returns 404 Not Found for a non-existent UUID', async () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .patch(`/api/players/${fakeUuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '0400 000 000' })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('returns 400 Bad Request for a field that is not editable', async () => {
      expect(savedPlayerId).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ personCode: 'P999' })
        .expect(400);
    });

    it('returns 400 Bad Request for an invalid email', async () => {
      expect(savedPlayerId).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('returns 400 Bad Request for a null non-nullable field', async () => {
      expect(savedPlayerId).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: null })
        .expect(400);
    });

    it('returns 400 Bad Request for an empty body', async () => {
      expect(savedPlayerId).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  // Adding a new player from the add player form
  describe('POST /api/players', () => {
    let clubToken: string;
    let kilsythId: string;
    let ringwoodId: string;

    // Every player made here is deleted again afterwards, so the list and
    // search tests above see the same seeded players on every run.
    const createdIds: string[] = [];

    // Unique per run, so a leftover from an interrupted run can't clash
    const runTag = Date.now();

    beforeAll(async () => {
      // Sophie is a CLUB_ADMIN of Kilsyth only
      const clubLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'club@tennis.com', password: 'password123' })
        .expect(200);
      clubToken = clubLogin.body.access_token;

      const clubs = await prisma.client.orm.public.Club.select('id', 'name').all();
      kilsythId = clubs.find((c: any) => c.name === 'Kilsyth Tennis Club')!.id;
      ringwoodId = clubs.find((c: any) => c.name === 'Ringwood Tennis Club')!.id;
    });

    afterAll(async () => {
      const orm = prisma.client.orm.public;
      for (const id of createdIds) {
        await orm.ClubMembership.where({ personId: id }).delete();
        await orm.Person.where({ id }).delete();
      }
    });

    it('creates a player with a primary club membership and returns the full profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Created',
          lastName: `Player${runTag}`,
          clubId: kilsythId,
          dateOfBirth: '2010-06-01T00:00:00.000Z',
          email: 'created.player@example.com',
          tennisAustraliaNumber: `TA-${runTag}`,
        })
        .expect(201);
      createdIds.push(response.body.id);

      expect(response.body).toEqual(
        expect.objectContaining({
          firstName: 'Created',
          lastName: `Player${runTag}`,
          email: 'created.player@example.com',
          tennisAustraliaNumber: `TA-${runTag}`,
          utrId: null,
          phone: null,
          primaryClubName: 'Kilsyth Tennis Club',
          competitions: [],
        }),
      );
      expect(response.body.personCode).toMatch(/^P\d{3,}$/);
      expect(response.body.dateOfBirth).toContain('2010-06-01');
      expect(response.body.clubs).toEqual([
        expect.objectContaining({ id: kilsythId, isPrimaryClub: true, isFinancialMember: false }),
      ]);
    });

    it('gives each new player a different player code', async () => {
      const first = await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Code', lastName: `One${runTag}`, clubId: kilsythId })
        .expect(201);
      createdIds.push(first.body.id);

      const second = await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Code', lastName: `Two${runTag}`, clubId: kilsythId })
        .expect(201);
      createdIds.push(second.body.id);

      expect(second.body.personCode).not.toBe(first.body.personCode);
    });

    it('shows the new player in the club-filtered player list', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Listed', lastName: `Player${runTag}`, clubId: kilsythId })
        .expect(201);
      createdIds.push(created.body.id);

      const response = await request(app.getHttpServer())
        .get(`/api/players?clubId=${kilsythId}&search=Player${runTag}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.map((p: any) => p.id)).toContain(created.body.id);
    });

    it('lets a club admin add a player to their own club', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${clubToken}`)
        .send({ firstName: 'Club', lastName: `Added${runTag}`, clubId: kilsythId, isFinancialMember: true })
        .expect(201);
      createdIds.push(response.body.id);

      expect(response.body.clubs).toEqual([
        expect.objectContaining({ id: kilsythId, isPrimaryClub: true, isFinancialMember: true }),
      ]);
    });

    it('returns 403 Forbidden when a club admin adds a player to another club', async () => {
      await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${clubToken}`)
        .send({ firstName: 'Wrong', lastName: `Club${runTag}`, clubId: ringwoodId })
        .expect(403);
    });

    it('returns 409 Conflict for a Tennis Australia number already in use', async () => {
      await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Duplicate',
          lastName: `Player${runTag}`,
          clubId: kilsythId,
          tennisAustraliaNumber: `TA-${runTag}`,
        })
        .expect(409);
    });

    it('returns 404 Not Found for a club that does not exist', async () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'No', lastName: 'Club', clubId: fakeUuid })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('returns 400 Bad Request when a required field is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lastName: 'NoFirstName', clubId: kilsythId })
        .expect(400);
    });

    it('returns 400 Bad Request for a field that cannot be set', async () => {
      await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Own', lastName: 'Code', clubId: kilsythId, personCode: 'P999' })
        .expect(400);
    });

    it('returns 400 Bad Request for an invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Bad', lastName: 'Email', clubId: kilsythId, email: 'not-an-email' })
        .expect(400);
    });
  });

  // Requires admin access
  describe('Unauthorized Access', () => {
    it('GET /api/players -> should return 401 Unauthorized when no token is provided', async () => {
      await request(app.getHttpServer()).get('/api/players').expect(401);
    });

    it('POST /api/players -> should return 401 Unauthorized when no token is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/players')
        .send({ firstName: 'No', lastName: 'Token' })
        .expect(401);
    });

    it('PATCH /api/players/:id -> should return 401 Unauthorized when no token is provided', async () => {
      expect(savedPlayerId).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/players/${savedPlayerId}`)
        .send({ phone: '0400 123 456' })
        .expect(401);
    });
  });
});

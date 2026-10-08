import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

  it('GET /api/teams/1 -> should return the flattened competition chain', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/teams/1')
      .expect(200);

    // Every level between the team and its association, flattened onto
    // the one response so the frontend can link to any of them without a
    // further lookup.
    expect(response.body).toMatchObject({
      clubId: expect.any(String),
      clubName: expect.any(String),
      sectionId: expect.any(Number),
      sectionName: expect.any(String),
      seasonId: expect.any(Number),
      seasonName: expect.any(String),
      competitionId: expect.any(String),
      competitionName: expect.any(String),
      associationId: expect.any(String),
      associationName: expect.any(String),
    });

    // Each roster entry is the flattened player shape, not a raw
    // TeamPlayer/Person join row.
    expect(response.body.players[0]).toMatchObject({
      personId: expect.any(String),
      firstName: expect.any(String),
      lastName: expect.any(String),
    });
  });

  it('GET /api/teams/9999 -> should return a 404 Not Found for missing IDs', async () => {
    // This proves our NotFoundException in the service works correctly!
    await request(app.getHttpServer()).get('/api/teams/9999').expect(404);
  });

  it('GET /api/teams/abc -> should return a 400 Bad Request for a non-numeric ID', async () => {
    // ParseIntPipe rejects a non-numeric :id before it ever reaches the service.
    await request(app.getHttpServer()).get('/api/teams/abc').expect(400);
  });

  it('GET /api/teams/1/record -> should return the team\'s row out of its section ladder', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/teams/1/record')
      .expect(200);

    expect(response.body.teamId).toBe(1);
    expect(response.body).toHaveProperty('sectionId');
    expect(response.body).toHaveProperty('sectionName');
    expect(response.body).toHaveProperty('position');
    expect(response.body).toHaveProperty('winPercentage');

    // matchesPlayed is exactly the sum of the three outcomes — this is
    // the same invariant the ladder itself holds, since the record IS a
    // row out of that ladder.
    expect(response.body.matchesPlayed).toBe(
      response.body.matchesWon + response.body.matchesDrawn + response.body.matchesLost,
    );
  });

  it('GET /api/teams/9999/record -> should return a 404 Not Found for missing IDs', async () => {
    await request(app.getHttpServer()).get('/api/teams/9999/record').expect(404);
  });

  it('GET /api/teams/abc/record -> should return a 400 Bad Request for a non-numeric ID', async () => {
    await request(app.getHttpServer()).get('/api/teams/abc/record').expect(400);
  });
});

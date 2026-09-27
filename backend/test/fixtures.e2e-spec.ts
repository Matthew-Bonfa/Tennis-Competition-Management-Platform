import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Fixtures Feature (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Ensures params are provided
  it('GET /api/fixtures -> should return 400 Bad Request if neither teamId nor sectionId are provided', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fixtures')
      .expect(400);

    expect(response.body.message).toBe(
      'Need to provide teamId, sectionId, or both',
    );
  });

  // All fixtures for sectionId 1
  it('GET /api/fixtures?sectionId=1 -> should return all fixtures for the section', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fixtures?sectionId=1')
      .expect(200);

    // Non empty correctly formatted data
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('matchId');
    expect(response.body[0]).toHaveProperty('sectionId');
    expect(response.body[0]).toHaveProperty('status');
  });

  // All matches for a teamId 2
  it('GET /api/fixtures?teamId=2 -> should return fixtures for a specific team', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fixtures?teamId=2')
      .expect(200);

    // Only 1 match
    expect(response.body).toHaveLength(1);
  });

  // All upcoming fixtures for sectionId 1
  it('GET /api/fixtures?sectionId=1&status=upcoming -> should filter for scheduled matches', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fixtures?sectionId=1&status=upcoming')
      .expect(200);

    // Only 1 scheduled match
    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe('scheduled');
  });

  // All completed matches for sectionId 1
  it('GET /api/fixtures?sectionId=1&status=results -> should filter for completed matches', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fixtures?sectionId=1&status=results')
      .expect(200);

    // Only 1 match results
    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe('completed');
  });

  // Ensures invalid statuses return an error
  it('GET /api/fixtures?status=invalid -> should return 400 due to ParseEnumPipe', async () => {
    await request(app.getHttpServer())
      .get('/api/fixtures?sectionId=1&status=invalid')
      .expect(400);
  });

  // Ensures team ids that dont exist return invalid
  it('GET /api/fixtures?teamId=9999 -> should return 404 Not Found for non-existent team', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fixtures?teamId=9999')
      .expect(404);

    expect(response.body.message).toContain('Team with ID 9999 not found');
  });

  // Ensures section ids that dont exist return invalid
  it('GET /api/fixtures?sectionId=9999 -> should return 404 Not Found for non-existent section', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fixtures?sectionId=9999')
      .expect(404);

    expect(response.body.message).toContain('Section with ID 9999 not found');
  });
});

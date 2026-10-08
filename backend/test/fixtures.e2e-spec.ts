import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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

    expect(response.body.length).toBeGreaterThan(0);
  });

  // All upcoming fixtures for sectionId 1
  it('GET /api/fixtures?sectionId=1&status=upcoming -> should filter for scheduled matches', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fixtures?sectionId=1&status=upcoming')
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].status).toBe('scheduled');
  });

  // All completed matches for sectionId 1
  it('GET /api/fixtures?sectionId=1&status=results -> should filter for completed matches', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fixtures?sectionId=1&status=results')
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
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

  // CSV export
  it('GET /api/fixtures/export?sectionId=1 -> should return a CSV attachment', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/fixtures/export?sectionId=1')
      .expect(200)
      .expect('Content-Type', /text\/csv/);

    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="fixtures-section-1-all.csv"',
    );

    const text = (response.text as string).replace(/^﻿/, '');
    const lines = text.split('\r\n');

    expect(lines[0]).toBe(
      'Round,Date,Time,Status,Home Team,Away Team,Home Rubbers,Away Rubbers,Outcome,Section ID,Match ID',
    );
    // One data row per fixture returned by the JSON endpoint
    const jsonResponse = await request(app.getHttpServer())
      .get('/api/fixtures?sectionId=1')
      .expect(200);
    expect(lines.length).toBe(jsonResponse.body.length + 1);
  });

  it('GET /api/fixtures/export -> should return 400 Bad Request if neither teamId nor sectionId are provided', async () => {
    await request(app.getHttpServer()).get('/api/fixtures/export').expect(400);
  });

  it('GET /api/fixtures/export?sectionId=9999 -> should return 404 Not Found for non-existent section', async () => {
    await request(app.getHttpServer())
      .get('/api/fixtures/export?sectionId=9999')
      .expect(404);
  });
});

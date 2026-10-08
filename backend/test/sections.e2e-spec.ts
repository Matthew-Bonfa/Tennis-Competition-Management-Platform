import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
    expect(response.body.length).toBeGreaterThan(0);

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

  // CSV export
  it('GET /api/sections/1/ladder/export -> should return a CSV attachment', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/sections/1/ladder/export')
      .expect(200)
      .expect('Content-Type', /text\/csv/);

    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="ladder-section-1.csv"',
    );

    const text = (response.text as string).replace(/^﻿/, '');
    const lines = text.split('\r\n');

    expect(lines[0]).toBe(
      'Position,Team,Played,Won,Drawn,Lost,Rubbers For,Rubbers Against,Sets For,Sets Against,Games For,Games Against,Percentage,Points',
    );

    const jsonResponse = await request(app.getHttpServer())
      .get('/api/sections/1/ladder')
      .expect(200);
    expect(lines.length).toBe(jsonResponse.body.length + 1);
  });

  it('GET /api/sections/9999/ladder/export -> should return 404 Not Found for non-existent section', async () => {
    await request(app.getHttpServer())
      .get('/api/sections/9999/ladder/export')
      .expect(404);
  });
});

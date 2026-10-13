import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Associations Feature (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  // Variable for testing
  let savedAssociationId: string;

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

  // Summary data of all associations
  it('GET /api/associations -> should return a summary list of all associations', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/associations')
      .expect(200);

    // Non empty array should be returned
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    // Verifies the body is of the correct type
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
      }),
    );

    // Save uuid for the next test
    savedAssociationId = response.body[0].id;
  });

  // All data for a specific association
  it('GET /api/associations/:id -> should return full details for a specific association', async () => {
    expect(savedAssociationId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/associations/${savedAssociationId}`)
      .expect(200);

    // Verifies the body is of the correct type
    expect(response.body).toEqual(
      expect.objectContaining({
        contactPersonId: expect.any(String),
        id: savedAssociationId,
        name: expect.any(String),
      }),
    );
  });

  // Testing correct error response to invalid id
  it('GET /api/associations/:id -> should return 404 Not Found for a non-existent UUID', async () => {
    // uuid not in the db
    const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

    const response = await request(app.getHttpServer())
      .get(`/api/associations/${fakeUuid}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });


  it('POST /api/associations -> should return 201 Created for a new association', async () => {
    const newAssociation = {name: "Unreal Tennis Association"};
    const response = await request(app.getHttpServer())
      .post('/api/associations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newAssociation)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
    expect(response.body.name).toBe(newAssociation.name);
  });

  it('PUT /api/associations/:id -> should return 200 when updating an existing association', async () => {
    const association = {name: "Association with typo"};
    const response = await request(app.getHttpServer())
      .post('/api/associations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(association)
      .expect(201);

    expect(response.body.name).toBe(association.name);
    expect(response.body).toHaveProperty('id');
    const id = response.body.id;

    const updatedAssociation = {name: "Association without typo"}
    const updateResponse = await request(app.getHttpServer())
      .put('/api/associations/' + id)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatedAssociation)
      .expect(200);

    expect(updateResponse.body.name).toBe(updatedAssociation.name);
    expect(updateResponse.body).toHaveProperty('id');
    expect(updateResponse.body.id).toBe(id);
  });

  it('PUT /api/associations/:id -> should return 404 for a non-existent id', async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000"
    const association = {name: "new association 123"};
    const response = await request(app.getHttpServer())
      .put('/api/associations/' + fakeId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(association)
      .expect(404);
  });

});

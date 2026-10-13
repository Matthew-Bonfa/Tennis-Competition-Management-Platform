import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Clubs Feature (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  // Variable for testing
  let savedClubId: string;

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

  // Summary data of all clubs
  it('GET /api/clubs -> should return a summary list of all clubs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/clubs')
      .expect(200);

    // Non empty array should be returned
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);

    // Verifies the body is of the correct type
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        isFinancialMember: expect.any(Boolean),
        teamCount: expect.any(Number),
        memberCount: expect.any(Number),
      }),
    );

    // Save uuid for the next test
    savedClubId = response.body[0].id;
  });

  // All data for a specific club
  it('GET /api/clubs/:id -> should return full details for a specific club', async () => {
    expect(savedClubId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/clubs/${savedClubId}`)
      .expect(200);

    // Verifies the body is of the correct type
    expect(response.body).toEqual(
      expect.objectContaining({
        id: savedClubId,
        name: expect.any(String),
        teams: expect.any(Array),
      }),
    );
  });

  // Testing correct error response to invalid id
  it('GET /api/clubs/:id -> should return 404 Not Found for a non-existent UUID', async () => {
    // uuid not in the db
    const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

    const response = await request(app.getHttpServer())
      .get(`/api/clubs/${fakeUuid}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  // can create a new club
  it("POST /api/clubs -> should create a new club record and return 201 Created", async () => {
    const newClub = {name: "the best tennis club"};

    const response = await request(app.getHttpServer())
      .post('/api/clubs')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(newClub)
      .expect(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name");
    expect(response.body.name).toBe(newClub.name);

  });

  // can update an existing club (make a new one for that test)
  // ie fill it with details

  it("PATCH /api/clubs/:id -> should return 200 after updating an existing club's fields", async () => {
    const club = {name: "the worst tennis club"};

    const createResponse = await request(app.getHttpServer())
      .post('/api/clubs')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(club)
      .expect(201);

    expect(createResponse.body).toHaveProperty("id");
    const id = createResponse.body.id;

    const update = {name: "the second worst tennis club", address: "64 Zoo Lane"}
    const response = await request(app.getHttpServer())
      .patch('/api/clubs/' + id)
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(update)
      .expect(200);

    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(id);
    expect(response.body).toHaveProperty("address");
    expect(response.body.address).toBe(update.address);
    expect(response.body.name).toBe(update.name);

  });

  // can break when trying to update one that doesn't exist
  it("PATCH /api/clubs/:id -> should return 404 when trying to update a nonexistent club id", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";

    await request(app.getHttpServer())
      .patch("/api/clubs/" + fakeId)
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send({name: "fake id tennis club"})
      .expect(404);
  });

  // return 401 when trying to create or update anything without being authorised
  it("POST /api/clubs -> should return 401 when trying to create a club without being authorised", async () => {
    await request(app.getHttpServer())
      .post("/api/clubs")
      .send({name: "club but i'm not authorised to make it"})
      .expect(401);
  });

  it("PATCH /api/clubs/:id -> should return 401 when updating a club without authorisation", async () => {
    const club = {name: "average tennis club"};

    const response = await request(app.getHttpServer())
      .post('/api/clubs')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(club)
      .expect(201);

    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    await request(app.getHttpServer())
      .patch('/api/clubs/' + id)
      .send({name: "slightly above average tennis club"})
      .expect(401);
  });


  /*

  !!! CAN'T TEST THAT THE ROLE ASSIGNMENT WORKED UNTIL THERE IS AN ENDPOINT TO CREATE A PERSON
      because the response is the club object containing parts of the person object attached to each role


  // can create a role
  it("PATCH /api/clubs/:id -> should be able to assign someone a role within the club", async () => {
    const club = {name: "club that has roles"};

    const response = await request(app.getHttpServer())
      .post('/api/clubs')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(newClub)
      .expect(201);

    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    // CREATE A REAL PERSON BECAUSE OTHERWISE THE findOneClub AT THE END OF updateDetails
    // WILL NOT BE ABLE TO MATCH THE PERSON ID TO A PERSON


    const fakeRole = {personId: newPerson.id, role: "best player"};
    const roleResponse = await request(app.getHttpServer())
      .patch("/api/clubs/" + id)
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send({roles: [fakeRole]})
      .expect(200);

    expect(roleResponse.body).toHaveProperty("roles")
    expect(roleRepsponse.body.roles).toBe([{role: fakeRole.role, person: {}}])

  });


  // can edit a role



  */



  // can break when trying to edit a role that doesn't exist
  it("PATCH /api/clubs/:id -> should get 404 when trying to edit a role record that doesn't exist", async () => {
    const club = {name: "club that has roles"};

    const response = await request(app.getHttpServer())
      .post('/api/clubs')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(club)
      .expect(201);

    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const fakePersonId = "00000000-0000-0000-0000-000000000000";
    const fakeRole = {id: "12341234-5678-5678-5678-123456781234", personId: fakePersonId, role: "best player"};
    await request(app.getHttpServer())
      .patch('/api/clubs/' + id)
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send({roles: [fakeRole]})
      .expect(404);
  });

});

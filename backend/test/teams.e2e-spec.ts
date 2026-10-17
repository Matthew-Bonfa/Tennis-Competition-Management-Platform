import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Teams Feature (e2e)', () => {
  let app: INestApplication;
  let exampleTeam: any;
  let exampleRequest: any;
  let adminToken: string;

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
    
    exampleTeam = response.body[0];
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

  /*
    register
      - 401
      - 201
      - 400
    getOneRequest
      - 401
      - 200
      - 
    getRequestsBySeason
      - 401

    deny
      - 401
    create
      - 401
    approve
      - 401
  */

  // register
  it('POST /api/teams/register -> should return 201 created when registering a team', async () => {
    expect(exampleTeam).toBeDefined();

    const newTeam = {
      clubId: exampleTeam.clubId,
      seasonId: exampleTeam.section.seasonId,
      sectionComment: "we're the best so put us in the best section",
      formatId: exampleTeam.section.formatId,
      name: "best team ever",
      players: exampleTeam.players.map(player => ({
        personId: player.personId
      }))
    };

    const response = await request(app.getHttpServer())
      .post('/api/teams/register')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(newTeam)
      .expect(201);

    expect(response.body).toBeDefined();
    expect(response.body.clubId).toBe(newTeam.clubId);
    expect(response.body.seasonId).toBe(newTeam.seasonId);
    expect(response.body.sectionComment).toBe(newTeam.sectionComment);
    expect(response.body.formatId).toBe(newTeam.formatId);
    expect(response.body.name).toBe(newTeam.name);

    const withPlayers = await request(app.getHttpServer())
      .get('/api/teams/requests/' + response.body.id)
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .expect(200);

    // check that the players in the database match the input
    expect(withPlayers.body.players.map(p => ({
      personId: p.personId,
      teamRequestId: p.teamRequestId
    })))
    .toStrictEqual(exampleTeam.players.map(p => ({
      personId: p.personId,
      teamRequestId: response.body.id
    })));

    exampleRequest = withPlayers.body;

  });

  it('POST /api/teams/register -> should return 401 if not logged in', async () => {
    await request(app.getHttpServer())
      .post('/api/teams/register')
      .send({name: "team but i'm not logged in"})
      .expect(401);
  });

  it('POST /api/teams/register -> should return 400 if fields are missing', async () => {
    await request(app.getHttpServer())
      .post('/api/teams/register')
      .send({name: "Bad team", sectionComment: "this team sucks so put them in the worst section please"})
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .expect(400);
  });

  it('GET /api/teams/requests/:id -> should return 200 for valid input', async () => {
    expect(exampleRequest).toHaveProperty('id');
    const response = await request(app.getHttpServer())
      .get('/api/teams/requests/' + exampleRequest.id)
      .set('AUTHORIZATION',  `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toStrictEqual(exampleRequest);
  });

  it('GET /api/teams/requests/:id -> should return 401 when not authorised', async () => {
    expect(exampleRequest).toHaveProperty('id');
    const response = await request(app.getHttpServer())
      .get('/api/teams/requests/' + exampleRequest.id)
      .expect(401);
  });

  it('GET /api/teams/requests/:id -> should return 400 for a non-integer id', async () => {
    await request(app.getHttpServer())
      .get('/api/teams/requests/' + "string instead of number")
      .set('AUTHORIZATION',  `Bearer ${adminToken}`)
      .expect(400);
  });

  it('GET /api/teams/requests/seasons/:id -> should return 200 for valid input', async () => {
    expect(exampleRequest).toHaveProperty("seasonId");

    const response = await request(app.getHttpServer())
      .get('/api/teams/requests/seasons/' + exampleRequest.seasonId)
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .expect(200);
    
    expect(response.body).toEqual(expect.any(Array));
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body).toContainEqual(exampleRequest);
  });

  it('GET /api/teams/requests/seasons/:id -> should return 401 when unauthorised', async () => {
    expect(exampleRequest).toHaveProperty("seasonId");

    const response = await request(app.getHttpServer())
      .get('/api/teams/requests/' + exampleRequest.seasonId)
      .expect(401);
  });

  it('GET /api/teams/requests/seasons/:id -> should return 400 for a bad id', async () => {
    await request(app.getHttpServer())
      .get('/api/teams/requests/bad-id')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .expect(400);
  });

  
  it('POST /api/teams -> should return 201 after creating a team', async () => {
    expect(exampleTeam).toBeDefined();

    const newTeam = {
      clubId: exampleTeam.clubId,
      sectionId: exampleTeam.sectionId,
      name: "average joes",
      players: [{personId: exampleTeam.players[0].personId}]
    }
    
    const response = await request(app.getHttpServer())
      .post('/api/teams')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send(newTeam)
      .expect(201);

    expect(response.body.clubId).toBe(newTeam.clubId);
    expect(response.body.sectionId).toBe(newTeam.sectionId);
    expect(response.body.name).toBe(newTeam.name);


    const getNewTeam = await request(app.getHttpServer())
      .get('/api/teams/' + response.body.id)
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .expect(200);

    expect(getNewTeam.body.players.map(p => ({
      personId: p.personId,
    })))
    .toStrictEqual(newTeam.players.map(p => ({
      personId: p.personId,
    })));    
  });

  it('POST /api/teams -> should return 401 if unauthorised', async () => {
    await request(app.getHttpServer())
      .post('/api/teams')
      .send({name: "team but not authorised"})
      .expect(401);
  });

    it('POST /api/teams -> should return 400 for bad input', async () => {
    await request(app.getHttpServer())
      .post('/api/teams')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send({name: "team name but nothing else"})
      .expect(400);
  });

  it('PATCH /api/teams/deny/:id -> should return 200 upon success', async () => {
    // create a request to deny
    expect(exampleTeam).toBeDefined();

    const newTeam = {
      clubId: exampleTeam.clubId,
      seasonId: exampleTeam.section.seasonId,
      sectionComment: "we're good so good section please",
      formatId: exampleTeam.section.formatId,
      name: "best team ever",
      players: exampleTeam.players.map(player => ({
        personId: player.personId
      }))
    };

    const response = await request(app.getHttpServer())
      .post('/api/teams/register')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(newTeam)
      .expect(201);
    

    // deny the one just created
    const update = await request(app.getHttpServer())
      .patch('/api/teams/deny/' + response.body.id)
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send()
      .expect(200);
    
    expect(update.body.pending).toBe(false);
    expect(update.body.teamId).toBeNull();
  });

  it('PATCH /api/teams/deny/:id -> should return 404 for non-existent id', async () => {
    await request(app.getHttpServer())
      .patch('/api/teams/deny/-67')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send()
      .expect(404);
  });

  it('PATCH /api/teams/deny/:id -> should return 401 when unauthorised', async () => {
    await request(app.getHttpServer())
      .patch('/api/teams/deny/123')
      .send()
      .expect(401);
  });

  it('PATCH /api/teams/deny/:id -> should return 400 when already approved/denied', async () => {
    expect(exampleTeam).toBeDefined();

    const newTeam = {
      clubId: exampleTeam.clubId,
      seasonId: exampleTeam.section.seasonId,
      sectionComment: "we're good so good section please",
      formatId: exampleTeam.section.formatId,
      name: "best team ever",
      players: exampleTeam.players.map(player => ({
        personId: player.personId
      }))
    };

    const response = await request(app.getHttpServer())
      .post('/api/teams/register')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(newTeam)
      .expect(201);
    

    // deny the one just created
    const update = await request(app.getHttpServer())
      .patch('/api/teams/deny/' + response.body.id)
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send()
      .expect(200);
    
    // deny it again
    await request(app.getHttpServer())
      .patch('/api/teams/deny/' + response.body.id)
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send()
      .expect(400);
  });

  it('PATCH /api/teams/approve/:id -> should return 201 created upon success', async () => {
    expect(exampleTeam).toBeDefined();

    const newTeam = {
      clubId: exampleTeam.clubId,
      seasonId: exampleTeam.section.seasonId,
      sectionComment: "don't care which section but just please approve us",
      formatId: exampleTeam.section.formatId,
      name: "happy tennis team",
      players: exampleTeam.players.map(player => ({
        personId: player.personId
      }))
    };

    const requestResponse = await request(app.getHttpServer())
      .post('/api/teams/register')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(newTeam)
      .expect(201);
    
    const response = await request(app.getHttpServer())
      .patch('/api/teams/approve/' + requestResponse.body.id)
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send({sectionId: exampleTeam.sectionId})
      .expect(200);

    expect(response.body.name).toBe(newTeam.name);
    expect(response.body.clubId).toBe(newTeam.clubId);

    const requestAfter = await request(app.getHttpServer())
      .get('/api/teams/requests/' + requestResponse.body.id)
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send()
      .expect(200);
    
    expect(requestAfter.body.teamId).toBe(response.body.id);
    expect(requestAfter.body.pending).toBe(false);
  });

  it('PATCH /api/teams/approve/:id -> should return 404 for non-existent id', async () => {
    await request(app.getHttpServer())
      .patch('/api/teams/approve/-67')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({sectionId: 67})
      .expect(404);
  });

  it('PATCH /api/teams/approve/:id -> should return 401 when unauthorised', async () => {
    await request(app.getHttpServer())
      .patch('/api/teams/approve/123')
      .send({sectionId: 67})
      .expect(401);
  });

  it('PATCH /api/teams/approve/:id -> shoudl return 400 bad request if already approved/denied', async () => {
    expect(exampleTeam).toBeDefined();

    const newTeam = {
      clubId: exampleTeam.clubId,
      seasonId: exampleTeam.section.seasonId,
      sectionComment: "about to approve twice btw",
      formatId: exampleTeam.section.formatId,
      name: "sad tennis team",
      players: exampleTeam.players.map(player => ({
        personId: player.personId
      }))
    };

    const requestResponse = await request(app.getHttpServer())
      .post('/api/teams/register')
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send(newTeam)
      .expect(201);
    
    const response = await request(app.getHttpServer())
      .patch('/api/teams/approve/' + requestResponse.body.id)
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send({sectionId: exampleTeam.sectionId})
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/teams/approve/' + requestResponse.body.id)
      .set("AUTHORIZATION", `Bearer ${adminToken}`)
      .send({sectionId: exampleTeam.sectionId})
      .expect(400);
  });

});

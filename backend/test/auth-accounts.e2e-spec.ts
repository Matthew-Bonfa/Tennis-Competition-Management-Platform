import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { toInstant } from '../src/common/temporal.js';
import { MailerService } from '../src/mail/mailer.service.js';

// The account endpoints only ever store the SHA-256 hash of the emailed
// token, so tests that need a known token insert a row they hashed themselves.
const sha256 = (token: string) => createHash('sha256').update(token).digest('hex');

// Every throwaway row gets a random suffix: the e2e suites share one seeded
// database and run in parallel, so hard-coded emails/ids would collide.
const suffix = () => randomBytes(6).toString('hex');

// All rows this spec creates carry a recognisable marker (personCode
// "e2e-acc-...", club names "e2e ...", emails "e2e-..."), so both the leftover
// sweep at startup and the final cleanup can find them by pattern alone.
describe('Auth Account Flows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminPersonId: string;

  // Deletes every throwaway row this spec family ever made, child-first so
  // the FKs never block. Runs before (clearing leftovers from an aborted run)
  // and after (clearing this run's rows).
  async function purgeRows() {
    const persons = await prisma.client.orm.public.Person
      .where((p) => p.personCode.like('e2e-acc-%'))
      .all();
    const clubs = await prisma.client.orm.public.Club
      .where((c) => c.name.like('e2e %'))
      .all();

    await prisma.client.orm.public.AccountToken
      .where((t) => t.email.like('e2e-%'))
      .deleteAll();

    for (const person of persons) {
      await prisma.client.orm.public.Account.where({ personId: person.id }).deleteAll();
      await prisma.client.orm.public.PersonRole.where({ personId: person.id }).deleteAll();
      await prisma.client.orm.public.Person.where({ id: person.id }).deleteAll();
    }
    for (const club of clubs) {
      await prisma.client.orm.public.PersonRole.where({ clubId: club.id }).deleteAll();
      await prisma.client.orm.public.Club.where({ id: club.id }).deleteAll();
    }
  }

  // Creates a person directly in the DB, bypassing the players API
  async function createPerson() {
    const s = suffix();
    return prisma.client.orm.public.Person.create({
      personCode: `e2e-acc-${s}`,
      firstName: 'E2E',
      lastName: `Account${s}`,
      email: null,
      phone: null,
    });
  }

  // Creates a person + account directly in the DB with a known password
  async function createAccountWithPassword(password: string) {
    const person = await createPerson();
    const email = `e2e-acc-${suffix()}@example.com`;
    await prisma.client.orm.public.Account.create({
      personId: person.id,
      email,
      passwordHash: await bcrypt.hash(password, 10),
    });
    return { person, email };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Never mail for real in tests: .env may hold live SMTP credentials, and
      // the SMTP round-trips would slow the suite (or time it out) anyway.
      .overrideProvider(MailerService)
      .useValue({ sendInviteEmail: async () => {}, sendResetEmail: async () => {} })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await purgeRows();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@tennis.com', password: 'password123' })
      .expect(200);

    adminToken = loginResponse.body.access_token;
    adminPersonId = loginResponse.body.personId;
  });

  afterAll(async () => {
    await purgeRows();
    await app.close();
  });

  // ========== INVITES ==========

  it('POST /api/auth/invites -> 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/invites')
      .send({ personId: '00000000-0000-0000-0000-000000000000', email: 'x@example.com', roles: [] })
      .expect(401);
  });

  it('POST /api/auth/invites -> 201 for a valid invite, replacing any earlier unused one', async () => {
    const person = await createPerson();
    const clubsResponse = await request(app.getHttpServer()).get('/api/clubs').expect(200);
    const clubId = clubsResponse.body[0].id;
    const email = `e2e-invite-${suffix()}@example.com`;

    // The console mailer logs the link instead of sending — no real email in tests
    const response = await request(app.getHttpServer())
      .post('/api/auth/invites')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ personId: person.id, email, roles: [{ role: 'PLAYER', clubId }] })
      .expect(201);

    expect(response.body.message).toContain(email);

    const inviteRows = () => prisma.client.orm.public.AccountToken
      .where((t) => t.email.eq(email))
      .where((t) => t.type.eq('invite'))
      .all();

    const stored = (await inviteRows())[0];
    expect(stored).toBeTruthy();
    expect(stored.usedAt).toBeNull();
    expect(JSON.parse(stored.rolesJson!)).toEqual([{ role: 'PLAYER', clubId }]);

    // A fresh invite for the same email replaces the earlier unused one
    await request(app.getHttpServer())
      .post('/api/auth/invites')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ personId: person.id, email, roles: [{ role: 'PLAYER', clubId }] })
      .expect(201);
    expect(await inviteRows()).toHaveLength(1);
  });

  it('POST /api/auth/invites -> 409 when the email or person already has an account', async () => {
    const person = await createPerson();
    const email = `e2e-conflict-${suffix()}@example.com`;

    // Email already belongs to an account
    await request(app.getHttpServer())
      .post('/api/auth/invites')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ personId: person.id, email: 'admin@tennis.com', roles: [] })
      .expect(409);

    // Person already has an account (the seeded admin's person)
    await request(app.getHttpServer())
      .post('/api/auth/invites')
      .set('AUTHORIZATION', `Bearer ${adminToken}`)
      .send({ personId: adminPersonId, email, roles: [] })
      .expect(409);
  });

  it('POST /api/auth/invites -> 403 when a club admin grants roles outside their own club', async () => {
    // Throwaway clubs: one the admin runs, one they don't
    const otherClub = await prisma.client.orm.public.Club.create({
      name: `e2e other club ${suffix()}`,
      isFinancialMember: false,
    });
    const ownClub = await prisma.client.orm.public.Club.create({
      name: `e2e own club ${suffix()}`,
      isFinancialMember: false,
    });

    const { person, email } = await createAccountWithPassword('password123');
    await prisma.client.orm.public.PersonRole.create({
      personId: person.id,
      role: 'CLUB_ADMIN',
      clubId: ownClub.id,
    });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    const clubAdminToken = login.body.access_token;

    // Association admin cannot be granted by a club admin at all
    await request(app.getHttpServer())
      .post('/api/auth/invites')
      .set('AUTHORIZATION', `Bearer ${clubAdminToken}`)
      .send({
        personId: (await createPerson()).id,
        email: `e2e-scoped-${suffix()}@example.com`,
        roles: [{ role: 'ASSOCIATION_ADMIN', associationId: '00000000-0000-0000-0000-000000000000' }],
      })
      .expect(403);

    // PLAYER at a club they don't administer
    await request(app.getHttpServer())
      .post('/api/auth/invites')
      .set('AUTHORIZATION', `Bearer ${clubAdminToken}`)
      .send({
        personId: (await createPerson()).id,
        email: `e2e-scoped-${suffix()}@example.com`,
        roles: [{ role: 'PLAYER', clubId: otherClub.id }],
      })
      .expect(403);

    // PLAYER at their own club is allowed
    await request(app.getHttpServer())
      .post('/api/auth/invites')
      .set('AUTHORIZATION', `Bearer ${clubAdminToken}`)
      .send({
        personId: (await createPerson()).id,
        email: `e2e-scoped-${suffix()}@example.com`,
        roles: [{ role: 'PLAYER', clubId: ownClub.id }],
      })
      .expect(201);
  });

  // ========== ACCEPT INVITE ==========

  it('GET /api/auth/invites/:token -> 404 for an unknown token', async () => {
    await request(app.getHttpServer())
      .get(`/api/auth/invites/${'a'.repeat(64)}`)
      .expect(404);
  });

  it('POST /api/auth/accept-invite -> creates the account, applies roles, single-use token', async () => {
    const person = await createPerson();
    const club = await prisma.client.orm.public.Club.create({
      name: `e2e accept club ${suffix()}`,
      isFinancialMember: false,
    });

    const email = `e2e-accept-${suffix()}@example.com`;
    const token = randomBytes(32).toString('hex');
    await prisma.client.orm.public.AccountToken.create({
      tokenHash: sha256(token),
      type: 'invite',
      email,
      personId: person.id,
      rolesJson: JSON.stringify([{ role: 'CLUB_ADMIN', clubId: club.id }]),
      expiresAt: toInstant(new Date(Date.now() + 60_000)),
    });

    // The invite page can look the link up before showing the form
    const check = await request(app.getHttpServer())
      .get(`/api/auth/invites/${token}`)
      .expect(200);
    expect(check.body).toEqual(
      expect.objectContaining({ email, personName: expect.stringContaining('E2E Account') }),
    );

    await request(app.getHttpServer())
      .post('/api/auth/accept-invite')
      .send({ token, password: 'newpassword123' })
      .expect(201);

    // The account works and carries the invited role
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'newpassword123' })
      .expect(200);
    expect(login.body.roles).toContain('CLUB_ADMIN');

    // The token cannot be used a second time
    await request(app.getHttpServer())
      .post('/api/auth/accept-invite')
      .send({ token, password: 'newpassword123' })
      .expect(404);
  });

  it('POST /api/auth/accept-invite -> 400 for a password under 8 characters', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/accept-invite')
      .send({ token: 'whatever', password: 'short' })
      .expect(400);
  });

  // ========== PASSWORD RESET ==========

  it('POST /api/auth/forgot-password -> always 200 with the same message, unknown or known email', async () => {
    const unknown = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: `e2e-nobody-${suffix()}@example.com` })
      .expect(200);

    const known = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'admin@tennis.com' })
      .expect(200);

    // Identical answers so the endpoint can't be used to enumerate emails
    expect(known.body).toEqual(unknown.body);
  });

  it('POST /api/auth/reset-password -> updates the password, single-use token', async () => {
    const oldPassword = 'oldpassword123';
    const { email } = await createAccountWithPassword(oldPassword);

    const token = randomBytes(32).toString('hex');
    await prisma.client.orm.public.AccountToken.create({
      tokenHash: sha256(token),
      type: 'password_reset',
      email,
      expiresAt: toInstant(new Date(Date.now() + 60_000)),
    });

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, password: 'brandnewpassword123' })
      .expect(200);

    // New password works, old one doesn't, token can't be reused
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'brandnewpassword123' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: oldPassword })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, password: 'anotherpassword123' })
      .expect(404);
  });

  it('POST /api/auth/reset-password -> 400 for an expired token', async () => {
    const token = randomBytes(32).toString('hex');
    await prisma.client.orm.public.AccountToken.create({
      tokenHash: sha256(token),
      type: 'password_reset',
      email: `e2e-expired-${suffix()}@example.com`,
      expiresAt: toInstant(new Date(Date.now() - 60_000)),
    });

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, password: 'somepassword123' })
      .expect(400);
  });
});

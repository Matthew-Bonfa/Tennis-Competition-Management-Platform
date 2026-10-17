import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

// Result entry runs against the Midweek Mixed Doubles fixture: Kilsyth Midweek
// (home, with Jack) v Ringwood Midweek (away, with Oliver). Section 1's
// fixtures are left alone because other suites read them.
//
// These tests change the database, and later tests rely on earlier ones, so
// run them in order against a freshly seeded database. CI always does; locally,
// re-seed before running this file a second time.
describe('Match result entry (e2e)', () => {
  let app: INestApplication;
  let jackToken: string;
  let oliverToken: string;
  let adminToken: string;

  let matchId: string;
  let homeTeamId: number;
  let form: any;

  const login = async (email: string) => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    return response.body.access_token as string;
  };

  const getForm = (token?: string) => {
    const req = request(app.getHttpServer()).get(`/api/matches/${matchId}/result-form`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  const submit = (token: string | undefined, body: unknown) => {
    const req = request(app.getHttpServer()).post(`/api/matches/${matchId}/result`);
    return (token ? req.set('Authorization', `Bearer ${token}`) : req).send(body as object);
  };

  const post = (path: 'confirm' | 'dispute', token: string | undefined, body?: object) => {
    const req = request(app.getHttpServer()).post(`/api/matches/${matchId}/${path}`);
    return (token ? req.set('Authorization', `Bearer ${token}`) : req).send(body);
  };

  const adminPut = (token: string | undefined, body: unknown) => {
    const req = request(app.getHttpServer()).put(`/api/matches/${matchId}/result`);
    return (token ? req.set('Authorization', `Bearer ${token}`) : req).send(body as object);
  };

  const getMatch = async () => (await request(app.getHttpServer()).get(`/api/matches/${matchId}`).expect(200)).body;

  const set = (setNumber: number, homeGames: number, awayGames: number) => ({
    setNumber, homeGames, awayGames, isMatchTiebreak: false,
  });

  // One rubber with a straight-sets result, with each side's pair taken from the form's rosters.
  const rubber = (rubberNumber: number, homeWins: boolean, overrides: Record<string, unknown> = {}) => ({
    rubberNumber,
    outcomeType: 'normal',
    homePlayerIds: form.homeTeam.players.map((p: any) => p.personId),
    awayPlayerIds: form.awayTeam.players.map((p: any) => p.personId),
    sets: homeWins ? [set(1, 6, 4), set(2, 6, 3)] : [set(1, 3, 6), set(2, 4, 6)],
    ...overrides,
  });

  // Home wins rubbers 1 to 3 and away wins rubber 4.
  const validSheet = () => ({
    rubbers: [rubber(1, true), rubber(2, true), rubber(3, true), rubber(4, false)],
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    // Same pipe options as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    jackToken = await login('volunteer@tennis.com');
    oliverToken = await login('ringwood.player@tennis.com');
    adminToken = await login('admin@tennis.com');

    // Find the Midweek fixture by its teams rather than hard-coding ids,
    // since ids depend on seed order.
    const teams = (await request(app.getHttpServer()).get('/api/teams').set('Authorization', `Bearer ${adminToken}`)).body;
    const kilsythMidweek = teams.find((t: any) => t.name === 'Kilsyth Midweek');
    const ringwoodMidweek = teams.find((t: any) => t.name === 'Ringwood Midweek');
    expect(kilsythMidweek).toBeDefined();
    expect(ringwoodMidweek).toBeDefined();

    const matches = (await request(app.getHttpServer()).get(`/api/matches?sectionId=${kilsythMidweek.sectionId}`)).body;
    const fixture = matches.find(
      (m: any) => m.homeTeamId === kilsythMidweek.id && m.awayTeamId === ringwoodMidweek.id,
    );
    expect(fixture).toBeDefined();
    matchId = fixture.id;
    homeTeamId = kilsythMidweek.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/matches/:id/result-form', () => {
    it('rejects a request with no token', async () => {
      await getForm().expect(401);
    });

    it('rejects someone who is not on either team', async () => {
      await getForm(adminToken).expect(403);
    });

    it('returns the rubber layout, scoring rules and both rosters for a player', async () => {
      const response = await getForm(jackToken).expect(200);
      form = response.body;

      expect(form).toMatchObject({
        matchId,
        matchStatus: 'scheduled',
        viewerSide: 'home',
        format: { setsToWin: 2, gamesPerSet: 6, tiebreakAtGames: 6, finalSetMatchTiebreak: false },
      });
      expect(form.rubbers).toHaveLength(4);
      expect(form.rubbers.every((r: any) => r.rubberType === 'mixed_doubles')).toBe(true);
      expect(form.rubbers.map((r: any) => r.rubberNumber)).toEqual([1, 2, 3, 4]);
      // mixed doubles needs a pair a side
      expect(form.homeTeam.players).toHaveLength(2);
      expect(form.awayTeam.players).toHaveLength(2);
      expect(form.homeTeam.id).toBe(homeTeamId);
    });
  });

  describe('POST /api/matches/:id/result', () => {
    it('rejects a request with no token', async () => {
      await submit(undefined, validSheet()).expect(401);
    });

    it('rejects someone who is not on either team', async () => {
      await submit(adminToken, validSheet()).expect(403);
    });

    it('rejects an empty list of rubbers', async () => {
      await submit(jackToken, { rubbers: [] }).expect(400);
    });

    it('rejects a field the API does not know about', async () => {
      await submit(jackToken, { ...validSheet(), matchWinner: 'home' }).expect(400);
    });

    it('rejects a sheet with a rubber missing', async () => {
      const response = await submit(jackToken, { rubbers: validSheet().rubbers.slice(0, 3) }).expect(400);

      expect(response.body.errors).toContain('Rubber 4: missing');
    });

    it('rejects a rubber with the wrong number of players', async () => {
      const sheet = validSheet();
      sheet.rubbers[0] = rubber(1, true, { homePlayerIds: [form.homeTeam.players[0].personId] });

      const response = await submit(jackToken, sheet).expect(400);

      expect(response.body.errors).toContain('Rubber 1: home side needs 2 players, got 1');
    });

    it('rejects a player who is not on that team', async () => {
      const sheet = validSheet();
      // the away pair listed for the home side
      sheet.rubbers[1] = rubber(2, true, { homePlayerIds: form.awayTeam.players.map((p: any) => p.personId) });

      const response = await submit(jackToken, sheet).expect(400);

      expect(response.body.errors.some((e: string) => e.startsWith('Rubber 2:'))).toBe(true);
    });

    it('rejects an illegal set score and names the rubber', async () => {
      const sheet = validSheet();
      sheet.rubbers[2] = rubber(3, true, { sets: [set(1, 8, 2), set(2, 6, 3)] });

      const response = await submit(jackToken, sheet).expect(400);

      expect(response.body.errors).toContain('Rubber 3: Illegal set score: 8-2');
    });

    it('does not save anything for a rejected sheet', async () => {
      const response = await request(app.getHttpServer()).get(`/api/matches/${matchId}`).expect(200);

      expect(response.body.matchStatus).toBe('scheduled');
      expect(response.body.rubbers).toHaveLength(0);
    });

    it('accepts a valid sheet and moves the match to awaiting confirmation', async () => {
      const response = await submit(jackToken, validSheet()).expect(201);

      expect(response.body.matchStatus).toBe('awaiting_confirmation');
      expect(response.body.enteredByPersonId).toEqual(expect.any(String));
      expect(response.body.confirmedByPersonId).toBeNull();
      // home won 3 rubbers to 1, and the server decided that, not the client
      expect(response.body.winningTeamId).toBe(homeTeamId);
    });

    it('saves every rubber with its type, winner, sets and players', async () => {
      const response = await request(app.getHttpServer()).get(`/api/matches/${matchId}`).expect(200);

      expect(response.body.rubbers).toHaveLength(4);
      expect(response.body.rubbers.map((r: any) => r.rubberType)).toEqual(Array(4).fill('mixed_doubles'));
      expect(response.body.rubbers.map((r: any) => r.scoreline)).toEqual(['6-4 6-3', '6-4 6-3', '6-4 6-3', '3-6 4-6']);
      expect(response.body.rubbers.map((r: any) => r.winningTeamId)).toEqual([
        homeTeamId, homeTeamId, homeTeamId, form.awayTeam.id,
      ]);
      expect(response.body.rubbers.every((r: any) => r.players.length === 4)).toBe(true);
    });

    it('rejects a second entry while the first awaits confirmation', async () => {
      await submit(jackToken, validSheet()).expect(409);
    });
  });

  // Jack entered the sheet above, so Oliver (the away side) is the one who can answer it.
  describe('POST /api/matches/:id/dispute', () => {
    it('rejects a request with no token', async () => {
      await post('dispute', undefined, { reason: 'Wrong score' }).expect(401);
    });

    it('rejects the team that entered the result', async () => {
      await post('dispute', jackToken, { reason: 'Wrong score' }).expect(403);
    });

    it('rejects someone who is not on either team', async () => {
      await post('dispute', adminToken, { reason: 'Wrong score' }).expect(403);
    });

    it('rejects a missing reason', async () => {
      await post('dispute', oliverToken, {}).expect(400);
    });

    it('rejects an empty reason', async () => {
      await post('dispute', oliverToken, { reason: '' }).expect(400);
    });

    it('lets the other team dispute the result', async () => {
      const response = await post('dispute', oliverToken, { reason: 'Rubber 4 was ours' }).expect(200);

      expect(response.body.matchStatus).toBe('disputed');
      expect(response.body.disputeReason).toBe('Rubber 4 was ours');
    });

    it('rejects a second dispute because nothing is awaiting confirmation', async () => {
      await post('dispute', oliverToken, { reason: 'Again' }).expect(409);
    });

    it('rejects confirming a disputed result', async () => {
      await post('confirm', oliverToken).expect(409);
    });

    it('lets a player re-enter the sheet, which clears the dispute', async () => {
      const response = await submit(jackToken, validSheet()).expect(201);

      expect(response.body.matchStatus).toBe('awaiting_confirmation');
      expect(response.body.disputeReason).toBeNull();
    });
  });

  describe('POST /api/matches/:id/confirm', () => {
    it('rejects a request with no token', async () => {
      await post('confirm', undefined).expect(401);
    });

    it('rejects the team that entered the result', async () => {
      await post('confirm', jackToken).expect(403);
    });

    it('rejects someone who is not on either team', async () => {
      await post('confirm', adminToken).expect(403);
    });

    it('does not change the match when a confirm is rejected', async () => {
      expect((await getMatch()).matchStatus).toBe('awaiting_confirmation');
    });

    it('lets the other team confirm, which completes the match', async () => {
      const response = await post('confirm', oliverToken).expect(200);

      expect(response.body.matchStatus).toBe('completed');
      expect(response.body.confirmedByPersonId).toEqual(expect.any(String));
      expect(response.body.confirmedByPersonId).not.toBe(response.body.enteredByPersonId);
      expect(response.body.winningTeamId).toBe(homeTeamId);
    });

    it('rejects a second confirm', async () => {
      await post('confirm', oliverToken).expect(409);
    });

    it('rejects a player entering a new result once the match is completed', async () => {
      await submit(jackToken, validSheet()).expect(409);
    });
  });

  describe('PUT /api/matches/:id/result (admin)', () => {
    // Away wins rubbers 1 to 3 and home wins rubber 4, the reverse of validSheet.
    const awaySheet = () => ({
      rubbers: [rubber(1, false), rubber(2, false), rubber(3, false), rubber(4, true)],
      note: 'Scoresheet was recorded the wrong way round',
    });

    it('rejects a request with no token', async () => {
      await adminPut(undefined, awaySheet()).expect(401);
    });

    it('rejects a player', async () => {
      await adminPut(jackToken, awaySheet()).expect(403);
    });

    it('rejects an invalid sheet', async () => {
      const response = await adminPut(adminToken, { rubbers: awaySheet().rubbers.slice(0, 3) }).expect(400);

      expect(response.body.errors).toContain('Rubber 4: missing');
    });

    it('rejects a field the API does not know about', async () => {
      await adminPut(adminToken, { ...awaySheet(), winningTeamId: homeTeamId }).expect(400);
    });

    it('leaves the result alone when the admin sheet is rejected', async () => {
      const match = await getMatch();

      expect(match.winningTeamId).toBe(homeTeamId);
      expect(match.rubbers.map((r: any) => r.scoreline)).toEqual(['6-4 6-3', '6-4 6-3', '6-4 6-3', '3-6 4-6']);
    });

    it('lets an association admin correct a completed result', async () => {
      const response = await adminPut(adminToken, awaySheet()).expect(200);

      expect(response.body.matchStatus).toBe('completed');
      // the server re-decided the winner: away now has 3 rubbers to 1
      expect(response.body.winningTeamId).toBe(form.awayTeam.id);
      expect(response.body.enteredByPersonId).toBe(response.body.confirmedByPersonId);
    });

    it('replaces the saved rubbers with the corrected ones', async () => {
      const match = await getMatch();

      expect(match.rubbers).toHaveLength(4);
      expect(match.rubbers.map((r: any) => r.scoreline)).toEqual(['3-6 4-6', '3-6 4-6', '3-6 4-6', '6-4 6-3']);
      expect(match.rubbers.map((r: any) => r.winningTeamId)).toEqual([
        form.awayTeam.id, form.awayTeam.id, form.awayTeam.id, homeTeamId,
      ]);
    });
  });
});

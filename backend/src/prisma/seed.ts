import { db } from './db.js';
import { Temporal } from '@js-temporal/polyfill';

async function main() {
  console.log('Starting database seed...');

  // =========================================================
  // PEOPLE
  // =========================================================
  const people = await Promise.all([
    db.orm.public.Person.create({
      personCode: 'P001',
      firstName: 'Jack',
      lastName: 'Thompson',
      dateOfBirth: Temporal.Instant.from('2001-03-15T00:00:00Z'),
      utrId: 'UTR100001',
      tennisAustraliaNumber: 'TA100001',
      email: 'jack.thompson@example.com',
      phone: '0400 000 001',
    }),
    db.orm.public.Person.create({
      personCode: 'P002',
      firstName: 'Daniel',
      lastName: 'Wilson',
      dateOfBirth: Temporal.Instant.from('1999-07-21T00:00:00Z'),
      utrId: 'UTR100002',
      tennisAustraliaNumber: 'TA100002',
      email: 'daniel.wilson@example.com',
      phone: '0400 000 002',
    }),
    db.orm.public.Person.create({
      personCode: 'P003',
      firstName: 'Oliver',
      lastName: 'Smith',
      dateOfBirth: Temporal.Instant.from('2002-11-04T00:00:00Z'),
      utrId: 'UTR100003',
      tennisAustraliaNumber: 'TA100003',
      email: 'oliver.smith@example.com',
      phone: '0400 000 003',
    }),
    db.orm.public.Person.create({
      personCode: 'P004',
      firstName: 'Noah',
      lastName: 'Brown',
      dateOfBirth: Temporal.Instant.from('2000-06-18T00:00:00Z'),
      utrId: 'UTR100004',
      tennisAustraliaNumber: 'TA100004',
      email: 'noah.brown@example.com',
      phone: '0400 000 004',
    }),
    db.orm.public.Person.create({
      personCode: 'P005',
      firstName: 'Ethan',
      lastName: 'Taylor',
      dateOfBirth: Temporal.Instant.from('2003-02-10T00:00:00Z'),
      utrId: 'UTR100005',
      tennisAustraliaNumber: 'TA100005',
      email: 'ethan.taylor@example.com',
      phone: '0400 000 005',
    }),
    db.orm.public.Person.create({
      personCode: 'P006',
      firstName: 'Liam',
      lastName: 'Anderson',
      dateOfBirth: Temporal.Instant.from('1998-09-27T00:00:00Z'),
      utrId: 'UTR100006',
      tennisAustraliaNumber: 'TA100006',
      email: 'liam.anderson@example.com',
      phone: '0400 000 006',
    }),
    db.orm.public.Person.create({
      personCode: 'P007',
      firstName: 'Henry',
      lastName: 'Martin',
      dateOfBirth: Temporal.Instant.from('2001-12-01T00:00:00Z'),
      utrId: 'UTR100007',
      tennisAustraliaNumber: 'TA100007',
      email: 'henry.martin@example.com',
      phone: '0400 000 007',
    }),
    db.orm.public.Person.create({
      personCode: 'P008',
      firstName: 'Thomas',
      lastName: 'Clark',
      dateOfBirth: Temporal.Instant.from('2002-05-13T00:00:00Z'),
      utrId: 'UTR100008',
      tennisAustraliaNumber: 'TA100008',
      email: 'thomas.clark@example.com',
      phone: '0400 000 008',
    }),
    db.orm.public.Person.create({
      personCode: 'P009',
      firstName: 'Sophie',
      lastName: 'Williams',
      dateOfBirth: Temporal.Instant.from('1995-04-12T00:00:00Z'),
      tennisAustraliaNumber: 'TA100009',
      email: 'sophie.williams@example.com',
      phone: '0400 000 009',
    }),
    db.orm.public.Person.create({
      personCode: 'P010',
      firstName: 'Emily',
      lastName: 'Davis',
      dateOfBirth: Temporal.Instant.from('1993-08-29T00:00:00Z'),
      tennisAustraliaNumber: 'TA100010',
      email: 'emily.davis@example.com',
      phone: '0400 000 010',
    }),
    db.orm.public.Person.create({
      personCode: 'P011',
      firstName: 'Michael',
      lastName: 'Evans',
      dateOfBirth: Temporal.Instant.from('1985-01-19T00:00:00Z'),
      email: 'michael.evans@example.com',
      phone: '0400 000 011',
    }),
    db.orm.public.Person.create({
      personCode: 'P012',
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: Temporal.Instant.from('1988-10-07T00:00:00Z'),
      email: 'sarah.johnson@example.com',
      phone: '0400 000 012',
    }),
  ]);

  const [
    jack,
    daniel,
    oliver,
    noah,
    ethan,
    liam,
    henry,
    thomas,
    sophie,
    emily,
    michael,
    sarah,
  ] = people;

  // =========================================================
  // ASSOCIATION & CLUBS
  // =========================================================
  const association = await db.orm.public.Association.create({
    name: 'Eastern Region Tennis Association',
    contactPersonId: michael.id,
  });

  const kilsyth = await db.orm.public.Club.create({
    name: 'Kilsyth Tennis Club',
    isFinancialMember: true,
    contactPersonId: sophie.id,
  });
  const ringwood = await db.orm.public.Club.create({
    name: 'Ringwood Tennis Club',
    isFinancialMember: true,
    contactPersonId: emily.id,
  });
  const croydon = await db.orm.public.Club.create({
    name: 'Croydon Tennis Club',
    isFinancialMember: true,
    contactPersonId: sarah.id,
  });
  const lilydale = await db.orm.public.Club.create({
    name: 'Lilydale Tennis Club',
    isFinancialMember: true,
    contactPersonId: michael.id,
  });

  await Promise.all(
    [
      { associationId: association.id, clubId: kilsyth.id },
      { associationId: association.id, clubId: ringwood.id },
      { associationId: association.id, clubId: croydon.id },
      { associationId: association.id, clubId: lilydale.id },
    ].map((data) => db.orm.public.AssociationClub.create(data)),
  );

  // =========================================================
  // FORMATS
  // =========================================================
  // Two groups here:
  //
  // 1. The six formats from Waverley's format spreadsheet. Per the day-split
  //    decision, any row whose "Team Members" column varies by day (Junior
  //    Triples, President's Cup, Singles/Doubles Rubbers, Green Ball Series)
  //    becomes two Format rows, one per day, each with a single clean
  //    genderEligibility set. L Series and G Series have no day split in the
  //    source sheet, so they're one row each.
  //
  //    President's Cup and Singles/Doubles Rubbers are seeded as separate,
  //    currently byte-for-byte identical formats — the sheet listed them
  //    separately and Delyth confirmed it was an unfinished draft, so
  //    whatever distinguishes them just hasn't landed in a column yet. Don't
  //    collapse these into one record.
  //
  //    L Series' two age brackets ("12 and under" / "10 and under") aren't
  //    modelled as two Formats — that's grading, which belongs on
  //    Section.gradeLabel once real seasons use this format, not on the
  //    format definition itself.
  //
  // 2. Two "legacy" adult formats that didn't come from the spreadsheet at
  //    all — they just describe the scoring shape the pre-existing seed
  //    match/rubber data below was already written against (best-of-three
  //    senior sets), so that data keeps making sense once Section stops
  //    carrying its own scoring fields.
  const [
    juniorTriplesSat,
    juniorTriplesSun,
    presidentsCupSat,
    presidentsCupSun,
    singlesDoublesRubbersSat,
    singlesDoublesRubbersSun,
    greenBallSat,
    greenBallSun,
    lSeries,
    gSeries,
    saturdayPennantFormat,
    midweekMixedFormat,
  ] = await Promise.all([
    db.orm.public.Format.create({
      associationId: association.id,
      name: 'Junior Triples — Saturday',
      dayOfWeek: 'saturday',
      minPlayers: 3,
      maxPlayers: 5,
      rubbersPerMatch: 6,
      setsToWin: 1,
      gamesPerSet: 6,
      tiebreakAtGames: 6,
      winnerDeterminedBy: 'sets_then_games',
      minCourts: 1,
    }),
    db.orm.public.Format.create({
      associationId: association.id,
      name: 'Junior Triples — Sunday',
      dayOfWeek: 'sunday',
      minPlayers: 3,
      maxPlayers: 5,
      rubbersPerMatch: 6,
      setsToWin: 1,
      gamesPerSet: 6,
      tiebreakAtGames: 6,
      winnerDeterminedBy: 'sets_then_games',
      minCourts: 1,
    }),
    db.orm.public.Format.create({
      associationId: association.id,
      name: "President's Cup — Saturday",
      dayOfWeek: 'saturday',
      minPlayers: 2,
      maxPlayers: 4,
      rubbersPerMatch: 3,
      setsToWin: 2,
      gamesPerSet: 6,
      tiebreakAtGames: 6,
      finalSetMatchTiebreak: true,
      winnerDeterminedBy: 'rubbers_then_sets',
      minCourts: 1,
    }),
    db.orm.public.Format.create({
      associationId: association.id,
      name: "President's Cup — Sunday",
      dayOfWeek: 'sunday',
      minPlayers: 2,
      maxPlayers: 4,
      rubbersPerMatch: 3,
      setsToWin: 2,
      gamesPerSet: 6,
      tiebreakAtGames: 6,
      finalSetMatchTiebreak: true,
      winnerDeterminedBy: 'rubbers_then_sets',
      minCourts: 1,
    }),
    // Byte-for-byte the same as President's Cup on every structured column —
    // see the note above. Seeded separately on purpose.
    db.orm.public.Format.create({
      associationId: association.id,
      name: 'Singles/Doubles Rubbers — Saturday',
      dayOfWeek: 'saturday',
      minPlayers: 2,
      maxPlayers: 4,
      rubbersPerMatch: 3,
      setsToWin: 2,
      gamesPerSet: 6,
      tiebreakAtGames: 6,
      finalSetMatchTiebreak: true,
      winnerDeterminedBy: 'rubbers_then_sets',
      minCourts: 1,
    }),
    db.orm.public.Format.create({
      associationId: association.id,
      name: 'Singles/Doubles Rubbers — Sunday',
      dayOfWeek: 'sunday',
      minPlayers: 2,
      maxPlayers: 4,
      rubbersPerMatch: 3,
      setsToWin: 2,
      gamesPerSet: 6,
      tiebreakAtGames: 6,
      finalSetMatchTiebreak: true,
      winnerDeterminedBy: 'rubbers_then_sets',
      minCourts: 1,
    }),
    db.orm.public.Format.create({
      associationId: association.id,
      name: 'Green Ball Series — Saturday',
      dayOfWeek: 'saturday',
      minPlayers: 3,
      maxPlayers: 5,
      rubbersPerMatch: 6,
      setsToWin: 1,
      gamesPerSet: 6,
      tiebreakAtGames: null, // "No tiebreaks are played in this competition"
      winnerDeterminedBy: 'sets_then_games',
      minCourts: 1,
    }),
    db.orm.public.Format.create({
      associationId: association.id,
      name: 'Green Ball Series — Sunday',
      dayOfWeek: 'sunday',
      minPlayers: 3,
      maxPlayers: 5,
      rubbersPerMatch: 6,
      setsToWin: 1,
      gamesPerSet: 6,
      tiebreakAtGames: null,
      winnerDeterminedBy: 'sets_then_games',
      minCourts: 1,
    }),
    db.orm.public.Format.create({
      associationId: association.id,
      name: 'L Series',
      dayOfWeek: 'sunday',
      minPlayers: 3,
      maxPlayers: 5,
      rubbersPerMatch: 3, // doubles only
      setsToWin: 1,
      gamesPerSet: 8, // "finished when 8 games have been played"
      tiebreakAtGames: null, // sudden-death deuce instead, not a tiebreak
      winnerDeterminedBy: 'sets_then_games',
      minCourts: 1,
    }),
    db.orm.public.Format.create({
      associationId: association.id,
      name: 'G Series',
      dayOfWeek: 'sunday',
      minPlayers: 3,
      maxPlayers: 4,
      minAge: 12,
      maxAge: 22,
      rubbersPerMatch: 6,
      setsToWin: 1,
      gamesPerSet: 6,
      tiebreakAtGames: 6,
      winnerDeterminedBy: 'ladder_position',
      minCourts: 2,
    }),
    // --- Legacy adult formats, not from the spreadsheet (see note above) ---
    db.orm.public.Format.create({
      associationId: association.id,
      name: 'Saturday Pennant — Singles/Doubles',
      dayOfWeek: 'saturday',
      minPlayers: 6,
      maxPlayers: 8,
      rubbersPerMatch: 6,
      setsToWin: 2,
      gamesPerSet: 6,
      tiebreakAtGames: 6,
      winnerDeterminedBy: 'sets_then_games',
      minCourts: 3,
    }),
    db.orm.public.Format.create({
      associationId: association.id,
      name: 'Midweek Mixed Doubles',
      dayOfWeek: 'wednesday',
      minPlayers: 4,
      maxPlayers: 6,
      rubbersPerMatch: 4,
      setsToWin: 2,
      gamesPerSet: 6,
      tiebreakAtGames: 6,
      winnerDeterminedBy: 'sets_then_games',
      minCourts: 2,
    }),
  ]);

  await Promise.all(
    [
      { formatId: juniorTriplesSat.id, gender: 'boys' as const },
      { formatId: juniorTriplesSat.id, gender: 'girls' as const },
      { formatId: juniorTriplesSat.id, gender: 'open' as const },
      { formatId: juniorTriplesSun.id, gender: 'girls' as const },
      { formatId: juniorTriplesSun.id, gender: 'open' as const },
      { formatId: presidentsCupSat.id, gender: 'boys' as const },
      { formatId: presidentsCupSat.id, gender: 'open' as const },
      { formatId: presidentsCupSun.id, gender: 'girls' as const },
      { formatId: presidentsCupSun.id, gender: 'open' as const },
      { formatId: singlesDoublesRubbersSat.id, gender: 'boys' as const },
      { formatId: singlesDoublesRubbersSat.id, gender: 'open' as const },
      { formatId: singlesDoublesRubbersSun.id, gender: 'girls' as const },
      { formatId: singlesDoublesRubbersSun.id, gender: 'open' as const },
      { formatId: greenBallSat.id, gender: 'boys' as const },
      { formatId: greenBallSat.id, gender: 'open' as const },
      { formatId: greenBallSun.id, gender: 'open' as const },
      { formatId: lSeries.id, gender: 'boys' as const },
      { formatId: lSeries.id, gender: 'girls' as const },
      { formatId: lSeries.id, gender: 'open' as const },
      { formatId: gSeries.id, gender: 'girls' as const },
      { formatId: saturdayPennantFormat.id, gender: 'open' as const },
      { formatId: midweekMixedFormat.id, gender: 'open' as const },
    ].map((data) => db.orm.public.FormatTeamGender.create(data)),
  );

  // =========================================================
  // CLUB MEMBERSHIPS & ROLES
  // =========================================================
  await Promise.all(
    [
      {
        personId: jack.id,
        clubId: kilsyth.id,
        isPrimaryClub: true,
        isFinancialMember: true,
      },
      {
        personId: daniel.id,
        clubId: kilsyth.id,
        isPrimaryClub: true,
        isFinancialMember: true,
      },
      {
        personId: oliver.id,
        clubId: ringwood.id,
        isPrimaryClub: true,
        isFinancialMember: true,
      },
      {
        personId: noah.id,
        clubId: ringwood.id,
        isPrimaryClub: true,
        isFinancialMember: true,
      },
      {
        personId: ethan.id,
        clubId: croydon.id,
        isPrimaryClub: true,
        isFinancialMember: true,
      },
      {
        personId: liam.id,
        clubId: croydon.id,
        isPrimaryClub: true,
        isFinancialMember: true,
      },
      {
        personId: henry.id,
        clubId: lilydale.id,
        isPrimaryClub: true,
        isFinancialMember: true,
      },
      {
        personId: thomas.id,
        clubId: lilydale.id,
        isPrimaryClub: true,
        isFinancialMember: true,
      },
      {
        personId: sophie.id,
        clubId: kilsyth.id,
        isPrimaryClub: true,
        isFinancialMember: true,
      },
      {
        personId: emily.id,
        clubId: ringwood.id,
        isPrimaryClub: true,
        isFinancialMember: true,
      },
    ].map((data) => db.orm.public.ClubMembership.create(data)),
  );

  await Promise.all(
    [
      {
        personId: michael.id,
        role: 'ASSOCIATION_ADMIN',
        associationId: association.id,
      },
      { personId: sophie.id, role: 'CLUB_ADMIN', clubId: kilsyth.id },
      { personId: emily.id, role: 'CLUB_ADMIN', clubId: ringwood.id },
      { personId: sarah.id, role: 'CLUB_ADMIN', clubId: croydon.id },
      { personId: jack.id, role: 'PLAYER', clubId: kilsyth.id },
      { personId: daniel.id, role: 'PLAYER', clubId: kilsyth.id },
      { personId: oliver.id, role: 'PLAYER', clubId: ringwood.id },
      { personId: noah.id, role: 'PLAYER', clubId: ringwood.id },
      { personId: ethan.id, role: 'PLAYER', clubId: croydon.id },
      { personId: liam.id, role: 'PLAYER', clubId: croydon.id },
      { personId: henry.id, role: 'PLAYER', clubId: lilydale.id },
      { personId: thomas.id, role: 'PLAYER', clubId: lilydale.id },
    ].map((data) => db.orm.public.PersonRole.create(data)),
  );

  // =========================================================
  // COMPETITION, SEASON & SECTION
  // =========================================================
  const competition = await db.orm.public.Competition.create({
    associationId: association.id,
    name: 'Saturday Open Pennant',
  });
  await db.orm.public.CompetitionFormat.create({
    competitionId: competition.id,
    formatId: saturdayPennantFormat.id,
  });
  const season = await db.orm.public.Season.create({
    competitionId: competition.id,
    name: 'Summer 2026/27',
    startDate: Temporal.Instant.from('2026-10-03T00:00:00Z'),
    endDate: Temporal.Instant.from('2027-03-20T00:00:00Z'),
  });
  const section = await db.orm.public.Section.create({
    seasonId: season.id,
    formatId: saturdayPennantFormat.id,
    name: 'Section 1',
  });

  // =========================================================
  // TEAMS & PLAYERS
  // =========================================================
  const kilsythTeam = await db.orm.public.Team.create({
    clubId: kilsyth.id,
    sectionId: section.id,
    name: 'Kilsyth A',
    teamGender: 'open',
  });
  const ringwoodTeam = await db.orm.public.Team.create({
    clubId: ringwood.id,
    sectionId: section.id,
    name: 'Ringwood A',
    teamGender: 'open',
  });
  const croydonTeam = await db.orm.public.Team.create({
    clubId: croydon.id,
    sectionId: section.id,
    name: 'Croydon A',
    teamGender: 'open',
  });
  const lilydaleTeam = await db.orm.public.Team.create({
    clubId: lilydale.id,
    sectionId: section.id,
    name: 'Lilydale A',
    teamGender: 'open',
  });

  await Promise.all(
    [
      { teamId: kilsythTeam.id, personId: jack.id },
      { teamId: kilsythTeam.id, personId: daniel.id },
      { teamId: ringwoodTeam.id, personId: oliver.id },
      { teamId: ringwoodTeam.id, personId: noah.id },
      { teamId: croydonTeam.id, personId: ethan.id },
      { teamId: croydonTeam.id, personId: liam.id },
      { teamId: lilydaleTeam.id, personId: henry.id },
      { teamId: lilydaleTeam.id, personId: thomas.id },
    ].map((data) => db.orm.public.TeamPlayer.create(data)),
  );

  // =========================================================
  // MATCH 1: Kilsyth vs Ringwood
  // =========================================================
  const match1 = await db.orm.public.Match.create({
    sectionId: section.id,
    homeTeamId: kilsythTeam.id,
    awayTeamId: ringwoodTeam.id,
    roundNumber: 1,
    matchDate: Temporal.Instant.from('2026-10-10T13:00:00Z'),
    matchStatus: 'completed',
    enteredByPersonId: sophie.id,
    confirmedByPersonId: emily.id,
  });

  const rubber1 = await db.orm.public.Rubber.create({
    matchId: match1.id,
    rubberNumber: 1,
    rubberType: 'singles',
    winningTeamId: kilsythTeam.id,
    outcomeType: 'normal',
  });
  await Promise.all(
    [
      { rubberId: rubber1.id, teamId: kilsythTeam.id, personId: jack.id },
      { rubberId: rubber1.id, teamId: ringwoodTeam.id, personId: oliver.id },
    ].map((data) => db.orm.public.RubberPlayer.create(data)),
  );
  await Promise.all(
    [
      { rubberId: rubber1.id, setNumber: 1, homeGames: 6, awayGames: 4 },
      { rubberId: rubber1.id, setNumber: 2, homeGames: 6, awayGames: 3 },
    ].map((data) => db.orm.public.RubberSet.create(data)),
  );

  const rubber2 = await db.orm.public.Rubber.create({
    matchId: match1.id,
    rubberNumber: 2,
    rubberType: 'singles',
    winningTeamId: ringwoodTeam.id,
    outcomeType: 'normal',
  });
  await Promise.all(
    [
      { rubberId: rubber2.id, teamId: kilsythTeam.id, personId: daniel.id },
      { rubberId: rubber2.id, teamId: ringwoodTeam.id, personId: noah.id },
    ].map((data) => db.orm.public.RubberPlayer.create(data)),
  );
  await Promise.all(
    [
      { rubberId: rubber2.id, setNumber: 1, homeGames: 3, awayGames: 6 },
      { rubberId: rubber2.id, setNumber: 2, homeGames: 5, awayGames: 7 },
    ].map((data) => db.orm.public.RubberSet.create(data)),
  );

  const rubber3 = await db.orm.public.Rubber.create({
    matchId: match1.id,
    rubberNumber: 3,
    rubberType: 'doubles',
    winningTeamId: kilsythTeam.id,
    outcomeType: 'normal',
  });
  await Promise.all(
    [
      { rubberId: rubber3.id, teamId: kilsythTeam.id, personId: jack.id },
      { rubberId: rubber3.id, teamId: kilsythTeam.id, personId: daniel.id },
      { rubberId: rubber3.id, teamId: ringwoodTeam.id, personId: oliver.id },
      { rubberId: rubber3.id, teamId: ringwoodTeam.id, personId: noah.id },
    ].map((data) => db.orm.public.RubberPlayer.create(data)),
  );
  await Promise.all(
    [
      { rubberId: rubber3.id, setNumber: 1, homeGames: 6, awayGames: 2 },
      { rubberId: rubber3.id, setNumber: 2, homeGames: 4, awayGames: 6 },
      { rubberId: rubber3.id, setNumber: 3, homeGames: 6, awayGames: 4 },
    ].map((data) => db.orm.public.RubberSet.create(data)),
  );

  // =========================================================
  // REMAINING SEASON FIXTURES
  // =========================================================
  // Round 1's Kilsyth vs Ringwood fixture is already seeded above with a
  // full scoreline. The rest below are plain scheduled fixtures spread
  // across a few more rounds so there's something for the round selector
  // and ladder to page through beyond a single played match.
  await Promise.all(
    [
      // Round 1's other fixture
      {
        homeTeamId: croydonTeam.id,
        awayTeamId: lilydaleTeam.id,
        roundNumber: 1,
        matchDate: Temporal.Instant.from('2026-10-10T13:00:00Z'),
      },
      // Round 2
      {
        homeTeamId: kilsythTeam.id,
        awayTeamId: croydonTeam.id,
        roundNumber: 2,
        matchDate: Temporal.Instant.from('2026-10-17T13:00:00Z'),
      },
      {
        homeTeamId: ringwoodTeam.id,
        awayTeamId: lilydaleTeam.id,
        roundNumber: 2,
        matchDate: Temporal.Instant.from('2026-10-17T13:00:00Z'),
      },
      // Round 3
      {
        homeTeamId: lilydaleTeam.id,
        awayTeamId: kilsythTeam.id,
        roundNumber: 3,
        matchDate: Temporal.Instant.from('2026-10-24T13:00:00Z'),
      },
      {
        homeTeamId: croydonTeam.id,
        awayTeamId: ringwoodTeam.id,
        roundNumber: 3,
        matchDate: Temporal.Instant.from('2026-10-24T13:00:00Z'),
      },
    ].map((data) =>
      db.orm.public.Match.create({
        sectionId: section.id,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        roundNumber: data.roundNumber,
        matchDate: data.matchDate,
        matchStatus: 'scheduled',
      }),
    ),
  );

  // =========================================================
  // SECOND COMPETITION
  // =========================================================
  // A separate competition in the same association, with its own season,
  // section and teams — Jack and Oliver each get a second team membership
  // here on top of their Saturday Open Pennant team above, so there's a
  // player in the seed data who belongs to more than one competition
  // (exercises the "multiple competitions" case on the player profile).
  const midweekCompetition = await db.orm.public.Competition.create({
    associationId: association.id,
    name: 'Midweek Mixed Doubles',
  });
  await db.orm.public.CompetitionFormat.create({
    competitionId: midweekCompetition.id,
    formatId: midweekMixedFormat.id,
  });
  const midweekSeason = await db.orm.public.Season.create({
    competitionId: midweekCompetition.id,
    name: 'Spring 2026',
    startDate: Temporal.Instant.from('2026-09-01T00:00:00Z'),
    endDate: Temporal.Instant.from('2026-12-15T00:00:00Z'),
  });
  const midweekSection = await db.orm.public.Section.create({
    seasonId: midweekSeason.id,
    formatId: midweekMixedFormat.id,
    name: 'Division 1',
  });

  const kilsythMidweekTeam = await db.orm.public.Team.create({
    clubId: kilsyth.id,
    sectionId: midweekSection.id,
    name: 'Kilsyth Midweek',
    teamGender: 'open',
  });
  const ringwoodMidweekTeam = await db.orm.public.Team.create({
    clubId: ringwood.id,
    sectionId: midweekSection.id,
    name: 'Ringwood Midweek',
    teamGender: 'open',
  });

  await Promise.all(
    [
      { teamId: kilsythMidweekTeam.id, personId: jack.id },
      { teamId: ringwoodMidweekTeam.id, personId: oliver.id },
    ].map((data) => db.orm.public.TeamPlayer.create(data)),
  );

  // A scheduled fixture so this second competition also shows up in the
  // player profile's "upcoming matches" row, not just the competitions list.
  await db.orm.public.Match.create({
    sectionId: midweekSection.id,
    homeTeamId: kilsythMidweekTeam.id,
    awayTeamId: ringwoodMidweekTeam.id,
    roundNumber: 1,
    matchDate: Temporal.Instant.from('2026-10-14T18:00:00Z'),
    matchStatus: 'scheduled',
  });

  // =========================================================
  // JUNIOR COMPETITIONS (format catalog only — no fixtures)
  // =========================================================
  // These two exist to give the junior/L/G formats above somewhere real to
  // be offered from (CompetitionFormat), matching the meeting notes' named
  // competitions. No seasons/sections/teams/matches are seeded under them —
  // this is deliberately just enough to exercise "a competition offers
  // these formats", not a full second set of fixture data.
  const saturdayMorningJuniors = await db.orm.public.Competition.create({
    associationId: association.id,
    name: 'Saturday Morning Juniors',
  });
  await Promise.all(
    [
      juniorTriplesSat.id,
      presidentsCupSat.id,
      singlesDoublesRubbersSat.id,
      greenBallSat.id,
    ].map((formatId) =>
      db.orm.public.CompetitionFormat.create({
        competitionId: saturdayMorningJuniors.id,
        formatId,
      }),
    ),
  );

  const sundayMorningJuniors = await db.orm.public.Competition.create({
    associationId: association.id,
    name: 'Sunday Morning Juniors',
  });
  await Promise.all(
    [
      juniorTriplesSun.id,
      presidentsCupSun.id,
      singlesDoublesRubbersSun.id,
      greenBallSun.id,
      lSeries.id,
      gSeries.id,
    ].map((formatId) =>
      db.orm.public.CompetitionFormat.create({
        competitionId: sundayMorningJuniors.id,
        formatId,
      }),
    ),
  );

  console.log('Database seeded successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.runtime().close();
  });

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
    }),
    db.orm.public.Person.create({
      personCode: 'P002',
      firstName: 'Daniel',
      lastName: 'Wilson',
      dateOfBirth: Temporal.Instant.from('1999-07-21T00:00:00Z'),
      utrId: 'UTR100002',
      tennisAustraliaNumber: 'TA100002',
    }),
    db.orm.public.Person.create({
      personCode: 'P003',
      firstName: 'Oliver',
      lastName: 'Smith',
      dateOfBirth: Temporal.Instant.from('2002-11-04T00:00:00Z'),
      utrId: 'UTR100003',
      tennisAustraliaNumber: 'TA100003',
    }),
    db.orm.public.Person.create({
      personCode: 'P004',
      firstName: 'Noah',
      lastName: 'Brown',
      dateOfBirth: Temporal.Instant.from('2000-06-18T00:00:00Z'),
      utrId: 'UTR100004',
      tennisAustraliaNumber: 'TA100004',
    }),
    db.orm.public.Person.create({
      personCode: 'P005',
      firstName: 'Ethan',
      lastName: 'Taylor',
      dateOfBirth: Temporal.Instant.from('2003-02-10T00:00:00Z'),
      utrId: 'UTR100005',
      tennisAustraliaNumber: 'TA100005',
    }),
    db.orm.public.Person.create({
      personCode: 'P006',
      firstName: 'Liam',
      lastName: 'Anderson',
      dateOfBirth: Temporal.Instant.from('1998-09-27T00:00:00Z'),
      utrId: 'UTR100006',
      tennisAustraliaNumber: 'TA100006',
    }),
    db.orm.public.Person.create({
      personCode: 'P007',
      firstName: 'Henry',
      lastName: 'Martin',
      dateOfBirth: Temporal.Instant.from('2001-12-01T00:00:00Z'),
      utrId: 'UTR100007',
      tennisAustraliaNumber: 'TA100007',
    }),
    db.orm.public.Person.create({
      personCode: 'P008',
      firstName: 'Thomas',
      lastName: 'Clark',
      dateOfBirth: Temporal.Instant.from('2002-05-13T00:00:00Z'),
      utrId: 'UTR100008',
      tennisAustraliaNumber: 'TA100008',
    }),
    db.orm.public.Person.create({
      personCode: 'P009',
      firstName: 'Sophie',
      lastName: 'Williams',
      dateOfBirth: Temporal.Instant.from('1995-04-12T00:00:00Z'),
      tennisAustraliaNumber: 'TA100009',
    }),
    db.orm.public.Person.create({
      personCode: 'P010',
      firstName: 'Emily',
      lastName: 'Davis',
      dateOfBirth: Temporal.Instant.from('1993-08-29T00:00:00Z'),
      tennisAustraliaNumber: 'TA100010',
    }),
    db.orm.public.Person.create({
      personCode: 'P011',
      firstName: 'Michael',
      lastName: 'Evans',
      dateOfBirth: Temporal.Instant.from('1985-01-19T00:00:00Z'),
    }),
    db.orm.public.Person.create({
      personCode: 'P012',
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: Temporal.Instant.from('1988-10-07T00:00:00Z'),
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
  const season = await db.orm.public.Season.create({
    competitionId: competition.id,
    name: 'Summer 2026/27',
    startDate: Temporal.Instant.from('2026-10-03T00:00:00Z'),
    endDate: Temporal.Instant.from('2027-03-20T00:00:00Z'),
  });
  const section = await db.orm.public.Section.create({
    seasonId: season.id,
    name: 'Section 1',
    rubbersPerMatch: 6,
    setsToWin: 2,
    gamesPerSet: 6,
  });

  // =========================================================
  // TEAMS & PLAYERS
  // =========================================================
  const kilsythTeam = await db.orm.public.Team.create({
    clubId: kilsyth.id,
    sectionId: section.id,
    name: 'Kilsyth A',
  });
  const ringwoodTeam = await db.orm.public.Team.create({
    clubId: ringwood.id,
    sectionId: section.id,
    name: 'Ringwood A',
  });
  const croydonTeam = await db.orm.public.Team.create({
    clubId: croydon.id,
    sectionId: section.id,
    name: 'Croydon A',
  });
  const lilydaleTeam = await db.orm.public.Team.create({
    clubId: lilydale.id,
    sectionId: section.id,
    name: 'Lilydale A',
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
  // UPCOMING MATCH
  // =========================================================
  await db.orm.public.Match.create({
    sectionId: section.id,
    homeTeamId: kilsythTeam.id,
    awayTeamId: croydonTeam.id,
    roundNumber: 2,
    matchDate: Temporal.Instant.from('2026-10-17T13:00:00Z'),
    matchStatus: 'scheduled',
  });

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

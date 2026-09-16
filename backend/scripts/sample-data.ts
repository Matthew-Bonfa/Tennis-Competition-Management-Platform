import { db } from '../src/prisma/db.js';
import { toInstant } from '../src/common/temporal.js';

const association = await db.orm.public.Association.create({
  name: 'Metro Tennis Association',
});

const person1 = await db.orm.public.Person.create({
  personCode: 'P001',
  firstName: 'Jamie',
  lastName: 'Nguyen',
});
const person2 = await db.orm.public.Person.create({
  personCode: 'P002',
  firstName: 'Sam',
  lastName: 'Reid',
});

const club = await db.orm.public.Club.create({
  name: 'Kew Tennis Club',
  isFinancialMember: true,
});

const competition = await db.orm.public.Competition.create({
  associationId: association.id,
  name: 'Winter Pennant',
});

const season = await db.orm.public.Season.create({
  competitionId: competition.id,
  name: '2026 Winter',
  startDate: toInstant(new Date('2026-05-01')),
  endDate: toInstant(new Date('2026-08-31')),
});

const section = await db.orm.public.Section.create({
  seasonId: season.id,
  name: 'Saturday Men Div 2',
  rubbersPerMatch: 4,
  setsToWin: 2,
  gamesPerSet: 6,
  tiebreakAtGames: 6,
});

const homeTeam = await db.orm.public.Team.create({
  clubId: club.id,
  sectionId: section.id,
  name: 'Kew 1',
});
const awayTeam = await db.orm.public.Team.create({
  clubId: club.id,
  sectionId: section.id,
  name: 'Kew 2',
});

await db.orm.public.TeamPlayer.create({ teamId: homeTeam.id, personId: person1.id });
await db.orm.public.TeamPlayer.create({ teamId: awayTeam.id, personId: person2.id });

// A completed match with one scored rubber: two straight sets and a
// match tiebreak standing in for a third, so the result sheet has a
// realistic scoreline to format and display.
const playedMatch = await db.orm.public.Match.create({
  sectionId: section.id,
  homeTeamId: homeTeam.id,
  awayTeamId: awayTeam.id,
  roundNumber: 1,
  matchDate: toInstant(new Date('2026-05-09T09:00:00')),
  matchStatus: 'completed',
});

const rubber = await db.orm.public.Rubber.create({
  matchId: playedMatch.id,
  rubberNumber: 1,
  rubberType: 'singles',
  outcomeType: 'normal',
  winningTeamId: homeTeam.id,
});

await db.orm.public.RubberPlayer.create({ rubberId: rubber.id, teamId: homeTeam.id, personId: person1.id });
await db.orm.public.RubberPlayer.create({ rubberId: rubber.id, teamId: awayTeam.id, personId: person2.id });

await db.orm.public.RubberSet.create({ rubberId: rubber.id, setNumber: 1, homeGames: 6, awayGames: 4 });
await db.orm.public.RubberSet.create({ rubberId: rubber.id, setNumber: 2, homeGames: 3, awayGames: 6 });
await db.orm.public.RubberSet.create({
  rubberId: rubber.id,
  setNumber: 3,
  homeGames: 1,
  awayGames: 0,
  isMatchTiebreak: true,
  homeTiebreakPoints: 10,
  awayTiebreakPoints: 7,
});

// A second, not-yet-played match, so the fixture list has something
// upcoming as well as something finished.
await db.orm.public.Match.create({
  sectionId: section.id,
  homeTeamId: awayTeam.id,
  awayTeamId: homeTeam.id,
  roundNumber: 2,
  matchDate: toInstant(new Date('2026-05-16T09:00:00')),
  matchStatus: 'scheduled',
});

console.log('Seeded one completed match (with a scored rubber) and one scheduled match.');
await db.close();

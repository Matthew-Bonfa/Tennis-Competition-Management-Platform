import type { TeamDetail, TeamPlayer } from './types.js';

type PersonRef = { id: string, firstName: string, lastName: string };

type TeamRow = {
    id: number;
    name: string;
    teamGender: string | null;
    club: { id: string; name: string };
    section: {
        id: number;
        name: string;
        season: {
            id: number;
            name: string;
            competition: {
                id: string;
                name: string;
                association: { id: string; name: string };
            };
        };
    };
    players: { person: PersonRef }[];
};

// Function to flatten the team row into the shape the profile page uses
export function toTeamDetail(team: TeamRow): TeamDetail {
    const section = team.section;
    const season = section.season;
    const competition = season.competition;

    return {
        id: team.id,
        name: team.name,
        teamGender: team.teamGender,
        clubId: team.club.id,
        clubName: team.club.name,
        sectionId: section.id,
        sectionName: section.name,
        seasonId: season.id,
        seasonName: season.name,
        competitionId: competition.id,
        competitionName: competition.name,
        associationId: competition.association.id,
        associationName: competition.association.name,
        players: team.players.map(toTeamPlayer),
    };
}

// Function to flatten the player row into the shape the profile page uses
function toTeamPlayer({ person }: { person: PersonRef }): TeamPlayer {
    return { personId: person.id, firstName: person.firstName, lastName: person.lastName };
}
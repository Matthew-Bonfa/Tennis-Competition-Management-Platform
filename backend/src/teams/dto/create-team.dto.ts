export class CreateTeamDto {
    clubId: string;
    name: string;
    seasonId: number;
    sectionId?: number;
    sectionComment: string;
    players: [{personId: string}];
}

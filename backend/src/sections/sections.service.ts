import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { summariseRubber } from '../rubbers/summarise-rubber.js';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class SectionsService {
    constructor(private readonly prisma: PrismaService) {}

    async retrieveCompletedMatches(sectionId: number): Promise<any> {
        return this.prisma.client.orm.public.Match
            .where({ sectionId, matchStatus: 'completed' })
            .include('homeTeam', (team) => team.select('id', 'name'))
            .include('awayTeam', (team) => team.select('id', 'name'))
            .include('rubbers', (rubber) => rubber
                .orderBy((r) => r.rubberNumber.asc())
                .include('sets', (set) => set.orderBy((s) => s.setNumber.asc()))
                .include('players', (player) => player.select('personId', 'teamId'))
            )
            .all();
    }

    async calculateLadder(sectionId: number) {
        const section = await this.prisma.client.orm.public.Section.where({ id: sectionId }).first();
        if (!section) {
            throw new NotFoundException(`Section ${sectionId} not found`);
        }

        const teams = await this.prisma.client.orm.public.Team
            .where({ sectionId })
            .select('id', 'name')
            .all();

        const matches = await this.retrieveCompletedMatches(sectionId);
        const ladder = new Map<number, { teamId: number; teamName: string; matchesPlayed: number; matchesWon: number; rubbersWon: number; rubbersLost: number; setsWon: number; setsLost: number; gamesWon: number; gamesLost: number; points: number }>();

        for (const team of teams) {
            ladder.set(team.id, { teamId: team.id, teamName: team.name, matchesPlayed: 0, matchesWon: 0, rubbersWon: 0, rubbersLost: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, points: 0 });
        }
        
        for (const match of matches) {
            const homeTeam = match.homeTeam;
            const awayTeam = match.awayTeam;
            const homeStats = ladder.get(homeTeam.id)!;
            const awayStats = ladder.get(awayTeam.id)!;

            homeStats.matchesPlayed++;
            awayStats.matchesPlayed++;

            let homeRubbersWon = 0;
            let awayRubbersWon = 0;

            for (const rubber of match.rubbers) {
                const rubberSummary = summariseRubber(rubber.sets);
                const homeGames = rubberSummary.homeGamesWon;
                const awayGames = rubberSummary.awayGamesWon;

                if (rubber.winningTeamId === homeTeam.id) {
                    homeRubbersWon++;
                } 
                else if (rubber.winningTeamId === awayTeam.id) {
                    awayRubbersWon++;
                }

                homeStats.setsWon += rubber.sets.filter((set: any) => set.homeGames > set.awayGames).length;
                homeStats.setsLost += rubber.sets.filter((set: any) => set.homeGames < set.awayGames).length;
                homeStats.gamesWon += homeGames;
                homeStats.gamesLost += awayGames;

                awayStats.setsWon += rubber.sets.filter((set: any) => set.awayGames > set.homeGames).length;
                awayStats.setsLost += rubber.sets.filter((set: any) => set.awayGames < set.homeGames).length;
                awayStats.gamesWon += awayGames;
                awayStats.gamesLost += homeGames;
            }

            if (homeRubbersWon > awayRubbersWon) {
                homeStats.matchesWon++;
                homeStats.points += section.pointsPerMatchWin;
            }
            else if (awayRubbersWon > homeRubbersWon) {
                awayStats.matchesWon++;
                awayStats.points += section.pointsPerMatchWin;
            }
            else {
                homeStats.points += section.pointsPerMatchWin / 2;
                awayStats.points += section.pointsPerMatchWin / 2;
            }

            homeStats.points += homeRubbersWon * section.pointsPerRubber;
            awayStats.points += awayRubbersWon * section.pointsPerRubber;

            homeStats.rubbersWon += homeRubbersWon;
            homeStats.rubbersLost += awayRubbersWon;
            awayStats.rubbersWon += awayRubbersWon;
            awayStats.rubbersLost += homeRubbersWon;
        }

        return Array.from(ladder.values()).sort((a, b) => b.points - a.points);
    }
}


// Builds the download URLs for the CSV export endpoints
import { baseURL } from './api'

// Exports the whole season's fixtures for one team, or for every team in
// the section when teamId is null (the "All Teams" option in the UI).
export function fixturesExportUrl(sectionId: string, teamId: string | null): string {
    return teamId
        ? `${baseURL}/fixtures/export?teamId=${teamId}`
        : `${baseURL}/fixtures/export?sectionId=${sectionId}`;
}

// Exports the current ladder standings for a section.
export function ladderExportUrl(sectionId: string): string {
    return `${baseURL}/sections/${sectionId}/ladder/export`;
}

// file created by Rex Kelly
// AI was used in writing this file (Gemini, Claude)

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AssociationProfile from './AssociationProfile'
import AssociationsPage from './AssociationsPage'
import ClubProfile from './ClubProfile'
import ClubsPage from './ClubsPage'
import AdminPage from './AdminPage'
import CompetitionProfile from './CompetitionProfile'
import CompetitionsPage from './CompetitionsPage'
import Home from './Home'
import PlayerProfile from './PlayerProfile'
import PlayersPage from './PlayersPage'
import Ribbon from './Ribbon'
import SectionPage from './SectionPage'
import MatchResultsPage from './MatchResultsPage'
import EnterResultPage from './match-results/EnterResultPage'
import TeamProfile from './TeamProfile'
import ManageAssociationsPage from './manage-associations/ManageAssociationsPage';
import CreateAssociationPage from './manage-associations/CreateAssociationPage';
import ManageCompetitionsPage from './manage-competitions/ManageCompetitionsPage';
import CreateCompetitionPage from './manage-competitions/CreateCompetitionPage';
import ManageCompetitionPage from './manage-competitions/ManageCompetitionPage';
import CreateSeasonPage from './manage-competitions/CreateSeasonPage';
import CreateSectionPage from './manage-competitions/CreateSectionPage';
import ManageSectionPage from './manage-competitions/ManageSectionPage';
import ManageSeasonPage from './manage-competitions/ManageSeasonPage';
import ManagePlayersPage from './manage-players/ManagePlayersPage';
import EditPlayerPage from './manage-players/EditPlayerPage';
import CreatePlayerPage from './manage-players/CreatePlayerPage';
import Login from './Login';
import ManageClubsPage from './manage-clubs/ManageClubsPage';
import EditClubPage from './manage-clubs/EditClubPage';
import { isAdmin, isAuthenticated } from './auth';
import RegisterTeamPage from './register-team/RegisterTeamPage';
import SelectCompetition from './register-team/SelectCompetition';
import ReviewRequests from './register-team/ReviewRequests';

// --- MAIN APP ROUTING ---
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Ribbon />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/associations" element={<AssociationsPage />} />
            <Route path="/associations/:id" element={<AssociationProfile />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/competitions" element={<CompetitionsPage />} />
            <Route path="/players" element={<PlayersPage />} />

            { /* The admin route is now protected properly */}
            <Route
              path="/admin"
              element={[
                isAuthenticated() && isAdmin() ? (
                  <AdminPage />
                ) : (
                  <div className="flex items-center justify-center h-screen bg-gray-50 px-4">
                    <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {isAuthenticated() ? 'Access Denied' : 'Please Sign In'}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {isAuthenticated()
                          ? 'You do not have permission to access the admin page.'
                          : 'Please sign in to access the admin page.'}
                      </p>
                      {!isAuthenticated() && (
                        <div className="mt-6">
                          <button
                            onClick={() => window.location.href = '/login'}
                            className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
                          >
                            Sign In
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ]}
            />

            <Route path="/clubs/:id" element={<ClubProfile />} />
            <Route path="/competitions/:id" element={<CompetitionProfile />} />
            <Route path="/players/:id" element={<PlayerProfile />} />
            <Route path="/teams/:id" element={<TeamProfile />} />

            <Route path="/sections/:sectionId" element={<SectionPage />} />
            <Route path="/matches/:matchId" element={<MatchResultsPage />} />
            <Route path="/matches/:matchId/enter" element={<EnterResultPage />} />

            <Route path="/manage-associations" element={<ManageAssociationsPage />} />
            <Route path="/manage-associations/create-new-association" element={<CreateAssociationPage />} />

            <Route path="/manage-competitions" element={<ManageCompetitionsPage />} />
            <Route path="/manage-competitions/create-new-competition" element={<CreateCompetitionPage />} />
            <Route path="/manage-competitions/:id" element={<ManageCompetitionPage />} />
            <Route path="/manage-competitions/:id/create-new-season" element={<CreateSeasonPage />} />
            <Route path="/manage-competitions/:id/create-new-section" element={<CreateSectionPage />} />
            <Route path="/manage-competitions/:id/sections/:sectionId" element={<ManageSectionPage />} />
            <Route path="/manage-competitions/:id/seasons/:seasonId" element={<ManageSeasonPage />} />
            <Route path="/manage-players" element={<ManagePlayersPage />} />
            <Route path="/manage-players/create-new-player" element={<CreatePlayerPage />} />
            <Route path="/manage-players/:id" element={<EditPlayerPage />} />

            <Route path="/manage-clubs" element={<ManageClubsPage />} />
            <Route path="/manage-clubs/:id" element={<EditClubPage />} />


            <Route path="/manage-teams" element={<RegisterTeamPage />} />
            <Route path="/manage-teams/register" element={<SelectCompetition />} />
            <Route path="/manage-teams/review" element={<ReviewRequests />} />

            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

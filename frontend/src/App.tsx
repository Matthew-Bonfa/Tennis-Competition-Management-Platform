// file created by Rex Kelly
// AI was used in writing this file (Gemini, Claude)

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AssociationProfile from './pages/associations/AssociationProfilePage'
import AssociationsPage from './pages/associations/AssociationsPage'
import ClubProfile from './pages/clubs/ClubProfilePage'
import ClubsPage from './pages/clubs/ClubsPage'
import AdminPage from './pages/AdminPage'
import CompetitionProfile from './pages/competitions/CompetitionProfilePage'
import CompetitionsPage from './pages/competitions/CompetitionsPage'
import Home from './pages/HomePage'
import PlayerProfile from './pages/players/PlayerProfilePage'
import PlayersPage from './pages/players/PlayersPage'
import Header from './components/layout/Header'
import SectionPage from './pages/competitions/SectionPage'
import MatchResultsPage from './pages/matches/MatchResultsPage'
import EnterResultPage from './pages/matches/EnterResultPage'
import TeamProfile from './pages/teams/TeamProfilePage'
import ManageAssociationsPage from './pages/manage/associations/ManageAssociationsPage';
import CreateAssociationPage from './pages/manage/associations/CreateAssociationPage';
import ManageCompetitionsPage from './pages/manage/competitions/ManageCompetitionsPage';
import CreateCompetitionPage from './pages/manage/competitions/CreateCompetitionPage';
import ManageCompetitionPage from './pages/manage/competitions/ManageCompetitionPage';
import CreateSeasonPage from './pages/manage/competitions/CreateSeasonPage';
import CreateSectionPage from './pages/manage/competitions/CreateSectionPage';
import ManageSectionPage from './pages/manage/competitions/ManageSectionPage';
import ManageSeasonPage from './pages/manage/competitions/ManageSeasonPage';
import ManagePlayersPage from './pages/manage/players/ManagePlayersPage';
import EditPlayerPage from './pages/manage/players/EditPlayerPage';
import CreatePlayerPage from './pages/manage/players/CreatePlayerPage';
import Login from './pages/LoginPage';
import ManageClubsPage from './pages/manage/clubs/ManageClubsPage';
import EditClubPage from './pages/manage/clubs/EditClubPage';
import { isAdmin, isAuthenticated } from './lib/auth';
import RegisterTeamPage from './pages/register-team/RegisterTeamPage';
import SelectCompetition from './pages/register-team/SelectCompetitionPage';
import ReviewRequests from './pages/register-team/ReviewRequestsPage';

// --- MAIN APP ROUTING ---
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-canvas flex flex-col font-sans">
        <Header />
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
                  <div className="flex items-center justify-center h-screen bg-canvas px-4">
                    <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-lg shadow">
                      <h2 className="text-2xl font-bold text-ink">
                        {isAuthenticated() ? 'Access Denied' : 'Please Sign In'}
                      </h2>
                      <p className="mt-1 text-sm text-ink-muted">
                        {isAuthenticated()
                          ? 'You do not have permission to access the admin page.'
                          : 'Please sign in to access the admin page.'}
                      </p>
                      {!isAuthenticated() && (
                        <div className="mt-6">
                          <button
                            onClick={() => window.location.href = '/login'}
                            className="w-full rounded bg-primary-600 py-2 font-medium text-white hover:bg-primary-700"
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

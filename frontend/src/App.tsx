// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import { Trophy, Users, Building2, MapPin, Search } from 'lucide-react';

import AssociationProfile from './AssociationProfile'
import AssociationsPage from './AssociationsPage'
import {ASSOCIATIONS} from './mock-data/MockAssociations'
import ClubProfile from './ClubProfile'
import ClubsPage from './ClubsPage'
import CompetitionProfile from './CompetitionProfile'
import CompetitionsPage from './CompetitionsPage'
import Home from './Home'
import PlayersPage from './PlayersPage'
import Ribbon from './Ribbon'



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

            <Route path="/clubs/:id" element={<ClubProfile />} />
            <Route path="/competitions/:id" element={<CompetitionProfile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
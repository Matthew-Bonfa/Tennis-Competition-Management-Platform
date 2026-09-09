// file created by Rex Kelly

import {Link} from 'react-router-dom';
import {Trophy} from 'lucide-react';

import CompetitionsPage from './CompetitionsPage'
import PlayersPage from './PlayersPage'
import AssociationsPage from './AssociationsPage'
import ClubsPage from './ClubsPage'
import Home from './Home'

import './Ribbon.css'


function Ribbon() {
  return (
    <nav>
      <Link to="/" className="ribbon-link"><Trophy />Tennis DB</Link>
      <Link to="/competitions" className="ribbon-link">Competitions</Link>
      <Link to="/players" className="ribbon-link">Players</Link>
      <Link to="/associations" className="ribbon-link">Associations</Link>
      <Link to="/clubs" className="ribbon-link">Clubs</Link>
    </nav>
  );
}

export default Ribbon;

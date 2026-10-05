// file created by Rex Kelly

import {NavLink} from 'react-router-dom';

import CompetitionsPage from './CompetitionsPage'
import PlayersPage from './PlayersPage'
import AssociationsPage from './AssociationsPage'
import ClubsPage from './ClubsPage'
import Home from './Home'

import waverleyLogo from './assets/WaverleyLogo.png'
import './Ribbon.css'


function Ribbon() {
  return (
    <nav>
      <NavLink to="/" end className="ribbon-link ribbon-link--logo">
        <img src={waverleyLogo} alt="Waverley Tennis" className="ribbon-logo" />
      </NavLink>
      <NavLink to="/competitions" className="ribbon-link">Competitions</NavLink>
      <NavLink to="/players" className="ribbon-link">Players</NavLink>
      <NavLink to="/associations" className="ribbon-link">Associations</NavLink>
      <NavLink to="/clubs" className="ribbon-link">Clubs</NavLink>
      <NavLink to="/admin" className="ribbon-link">Admin</NavLink>
    </nav>
  );
}

export default Ribbon;

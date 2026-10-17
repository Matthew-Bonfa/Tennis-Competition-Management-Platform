// file created by Rex Kelly

import { NavLink } from 'react-router-dom';

import waverleyLogo from './assets/WaverleyLogo.png'
import './Ribbon.css'
import { isAdmin, isAuthenticated, isClubAdmin } from './auth';

function Ribbon() {
  return (
    <nav>
      <NavLink to="/" end className="ribbon-link ribbon-link--logo">
        <img src={waverleyLogo} alt="Waverley Tennis" className="ribbon-logo" />
      </NavLink>
      <NavLink to="/competitions" className="ribbon-link">Competitions</NavLink>

      { /* Players button only shows if user is admin or club admin */}
      {isAuthenticated() && (isClubAdmin() || isAdmin()) && (
        <NavLink to="/players" className="ribbon-link">Players</NavLink>
      )}

      <NavLink to="/associations" className="ribbon-link">Associations</NavLink>
      <NavLink to="/clubs" className="ribbon-link">Clubs</NavLink>

      { /* Admin button only shows if user is admin */}
      {isAuthenticated() && isAdmin() && (
        <NavLink to="/admin" className="ribbon-link">Admin</NavLink>
      )}
    </nav>
  );
}

export default Ribbon;

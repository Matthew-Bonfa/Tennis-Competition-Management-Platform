// file created by Rex Kelly

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { NavLinkRenderProps } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import waverleyLogo from '../../assets/WaverleyLogo.png';
import { isAdmin, isAuthenticated, isClubAdmin } from '../../lib/auth';

interface NavItem {
  to: string;
  label: string;
}

/* Built once per render and used by both the desktop bar and the mobile panel, so the
   two lists cannot drift apart. The role checks are the same ones the old Ribbon ran. */
function navItems(): NavItem[] {
  const items: NavItem[] = [{ to: '/competitions', label: 'Competitions' }];

  /* Players button only shows if user is admin or club admin */
  if (isAuthenticated() && (isClubAdmin() || isAdmin())) {
    items.push({ to: '/players', label: 'Players' });
  }

  items.push({ to: '/associations', label: 'Associations' });
  items.push({ to: '/clubs', label: 'Clubs' });

  /* Admin button only shows if user is admin */
  if (isAuthenticated() && isAdmin()) {
    items.push({ to: '/admin', label: 'Admin' });
  }

  return items;
}

/* min-h-11 is 2.75rem (44px), the minimum comfortable touch target. */
const linkBase =
  'inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-700';

/* Log out is a secondary action, so it stays neutral and leaves the primary blue for
   the Log in call to action. */
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-canvas';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const authenticated = isAuthenticated();
  const items = navItems();

  /* The one behavioural addition in this refactor: the app previously had no way to sign
     out. It clears the same three keys LoginPage writes, then returns to /login. */
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('personId');
    localStorage.removeItem('roles');
    setMenuOpen(false);
    navigate('/login');
  };

  const linkClass = ({ isActive }: NavLinkRenderProps) =>
    `${linkBase} ${
      isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-ink-muted hover:bg-primary-50 hover:text-primary-700'
    }`;

  return (
    <header className="border-b border-border bg-surface">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" end className="inline-flex min-h-11 items-center rounded-md">
          <img src={waverleyLogo} alt="Waverley Tennis" className="h-10 w-auto sm:h-12" />
        </NavLink>

        {/* Desktop navigation. Below md this is hidden and the panel underneath takes over. */}
        <nav aria-label="Main" className="hidden md:flex md:items-center md:gap-1">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex md:items-center">
          {authenticated ? (
            <button type="button" onClick={handleLogout} className={secondaryButton}>
              Log out
            </button>
          ) : (
            <NavLink to="/login" className={primaryButton}>
              Log in
            </NavLink>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="header-mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-primary-50 hover:text-primary-700 md:hidden"
        >
          {menuOpen ? (
            <X aria-hidden="true" className="h-6 w-6" />
          ) : (
            <Menu aria-hidden="true" className="h-6 w-6" />
          )}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="header-mobile-menu"
          aria-label="Main menu"
          className="border-t border-border md:hidden"
        >
          <div className="flex flex-col gap-1 px-4 py-3 sm:px-6">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}

            <div className="mt-2 border-t border-border pt-3">
              {authenticated ? (
                <button type="button" onClick={handleLogout} className={`${secondaryButton} w-full`}>
                  Log out
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className={`${primaryButton} w-full`}
                  onClick={() => setMenuOpen(false)}
                >
                  Log in
                </NavLink>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;

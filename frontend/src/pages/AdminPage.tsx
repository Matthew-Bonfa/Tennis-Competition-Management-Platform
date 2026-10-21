import { Link } from 'react-router-dom';

function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-ink mb-6">Administration</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Link to="/manage-players"
          className="block bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          Manage Players
        </Link>
        <Link to="/manage-competitions"
          className="block bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          Manage Competitions
        </Link>
        <Link to="/manage-teams"
          className="block bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          Manage Teams
        </Link>
        <Link to="/manage-clubs"
          className="block bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          Manage Clubs
        </Link>
        <Link to="/manage-associations"
          className="block bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          Manage Associations
        </Link>
      </div>
    </div>
  );
}

export default AdminPage;

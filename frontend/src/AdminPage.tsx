import {Link} from 'react-router-dom';

function AdminPage() {
  return (
    <div>  
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Administration</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Link to="/enter-results"
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                Enter Results
        </Link>
        <Link to="/manage-players"
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                Manage Players
        </Link>
        <Link to="/manage-competitions"
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                Manage Competitions
        </Link>
        <Link to="/register-team"
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                Register a Team
        </Link>
        <Link to="/manage-clubs"
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                Manage Clubs
        </Link>
        <Link to="/manage-associations"
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                Manage Associations
        </Link>
      </div>
    </div>
  );
}

export default AdminPage;

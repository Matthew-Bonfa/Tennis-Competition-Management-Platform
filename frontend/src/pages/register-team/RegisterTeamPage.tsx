import { useNavigate } from 'react-router-dom';
import { isAdmin, isAuthenticated, isClubAdmin } from '../../lib/auth';

function RegisterTeamPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto my-10 p-8 bg-surface rounded-lg shadow-md border border-border font-sans text-ink">

      {/* Header Bar with Centered Text and Back Button */}
      <div className="mb-7 pb-4 border-b border-border relative flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-ink mb-1">
            Manage Teams
          </h2>
          <p className="text-sm text-ink-subtle">
            Select an option below to proceed.
          </p>
        </div>

        <button 
          onClick={() => navigate('/admin')}
          className="absolute right-0 flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-border text-ink-muted rounded-lg text-xs font-medium border border-border transition-all shadow-sm cursor-pointer"
        >
          <span>←</span> Back
        </button>
      </div>

      <div className="flex flex-col gap-4">

        {/* Option 1: Register a Team */}
        <button
          onClick={() => navigate('/manage-teams/register')}
          className="w-full p-5 bg-canvas hover:bg-primary-50 border border-border hover:border-primary-500 text-left rounded-lg transition-all shadow-sm flex items-center justify-between group cursor-pointer"
        >
          <div>
            <h3 className="text-base font-bold text-ink group-hover:text-primary-700 transition-colors">
              Register a Team
            </h3>
            <p className="text-xs text-ink-subtle mt-0.5">
              Submit a new team registration for an upcoming season.
            </p>
          </div>
          <span className="text-ink-subtle group-hover:text-primary-600 font-semibold text-lg transition-colors ml-4">
            →
          </span>
        </button>

        {/* Option 2: Review Requests (Only visible to authenticated Admins or Club Admins) */}
        {isAuthenticated() && (isAdmin() || isClubAdmin()) && (
          <button
            onClick={() => navigate('/manage-teams/review')}
            className="w-full p-5 bg-canvas hover:bg-primary-50 border border-border hover:border-primary-500 text-left rounded-lg transition-all shadow-sm flex items-center justify-between group cursor-pointer"
          >
            <div>
              <h3 className="text-base font-bold text-ink group-hover:text-primary-700 transition-colors">
                Review Registration Requests
              </h3>
              <p className="text-xs text-ink-subtle mt-0.5">
                View and manage pending team submissions to approve or deny them.
              </p>
            </div>
            <span className="text-ink-subtle group-hover:text-primary-600 font-semibold text-lg transition-colors ml-4">
              →
            </span>
          </button>
        )}

      </div>

    </div>
  );
}

export default RegisterTeamPage;
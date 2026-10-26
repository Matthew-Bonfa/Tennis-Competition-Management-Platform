import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { isAdmin, isAuthenticated, isClubAdmin } from '../../lib/auth';

function RegisterTeamPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-4 my-8 max-w-2xl p-8 bg-surface border border-border rounded-lg shadow-sm sm:mx-auto">

      {/* Header Bar with Back Button */}
      <div className="mb-7 pb-4 border-b border-border flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="text-3xl font-bold text-ink mb-1">
            Manage Teams
          </h2>
          <p className="text-sm text-ink-subtle">
            Select an option below to proceed.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin')}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 border border-border bg-muted text-ink-muted font-medium px-3 py-1.5 rounded-lg hover:bg-border transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="flex flex-col gap-4">

        {/* Option 1: Register a Team */}
        <button
          onClick={() => navigate('/manage-teams/register')}
          className="w-full p-5 bg-canvas hover:bg-surface border border-border text-left rounded-lg transition-colors flex items-center justify-between group"
        >
          <div>
            <h3 className="text-base font-bold text-ink group-hover:text-primary-700 transition-colors">
              Register a Team
            </h3>
            <p className="text-xs text-ink-subtle mt-0.5">
              Submit a new team registration for an upcoming season.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-ink-subtle group-hover:text-primary-600 transition-colors ml-4 shrink-0" />
        </button>

        {/* Option 2: Review Requests (Only visible to authenticated Admins or Club Admins) */}
        {isAuthenticated() && (isAdmin() || isClubAdmin()) && (
          <button
            onClick={() => navigate('/manage-teams/review')}
            className="w-full p-5 bg-canvas hover:bg-surface border border-border text-left rounded-lg transition-colors flex items-center justify-between group"
          >
            <div>
              <h3 className="text-base font-bold text-ink group-hover:text-primary-700 transition-colors">
                Review Registration Requests
              </h3>
              <p className="text-xs text-ink-subtle mt-0.5">
                View and manage pending team submissions to approve or deny them.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-ink-subtle group-hover:text-primary-600 transition-colors ml-4 shrink-0" />
          </button>
        )}

      </div>

    </div>
  );
}

export default RegisterTeamPage;
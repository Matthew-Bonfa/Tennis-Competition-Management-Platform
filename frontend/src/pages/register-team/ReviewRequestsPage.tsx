import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchApi from '../../lib/api';
import RequestDetails from './RequestDetails';
import type { NamedRef, Season, TeamRequest } from './types';

function ReviewRequests() {
  const navigate = useNavigate();

  const [futureSeasons, setFutureSeasons] = useState<Season[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TeamRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState<NamedRef[]>([]);

  // State to hold selected request for viewing details on the same URL
  const [selectedRequest, setSelectedRequest] = useState<TeamRequest | null>(null);

  useEffect(() => {
    async function getRequests() {
      try {
        setLoading(true);
        let seasons: Season[] = await fetchApi('/seasons');
        let now = new Date('2026-06-15T00:00:00Z');
        
        seasons = seasons.filter(s => new Date(s.startDate) > now);
        setFutureSeasons(seasons);

        let seasonIds = seasons.map(s => s.id);

        let compIds: string[] = [];
        for (let i = 0; i < seasons.length; i++) {
          if (!compIds.includes(seasons[i].competitionId)) {
            compIds.push(seasons[i].competitionId);
          }
        }
        let comps: NamedRef[] = [];
        for (let i = 0; i < compIds.length; i++) {
          let data = await fetchApi('/competitions/' + compIds[i]);
          comps.push({ id: data.id, name: data.name });
        }
        setCompetitions(comps);
        
        let allRequests: TeamRequest[] = [];
        for (let i = 0; i < seasons.length; i++) {
          let data = await fetchApi('/teams/requests/seasons/' + seasons[i].id);
          if (Array.isArray(data)) {
            allRequests.push(...data);
          }
        }
        
        let filteredRequests = allRequests.filter(
          r => seasonIds.includes(r.seasonId) && r.pending
        );
        setPendingRequests(filteredRequests);
      } catch (err) {
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    }

    getRequests();
  }, []);

  return (
    <div className="max-w-2xl mx-auto my-10 p-8 bg-surface rounded-2xl shadow-md border border-border font-sans text-ink">

      {/* Conditional Rendering: Show Details Component if selected, otherwise show List */}
      {selectedRequest ? (
        <RequestDetails 
          request={selectedRequest} 
          onBack={() => setSelectedRequest(null)} 
        />
      ) : (
        <>
          {/* Header Bar with Back Button */}
          <div className="mb-7 pb-4 border-b border-border flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-ink">
                Review Registration Requests
              </h2>
              <p className="text-sm text-ink-subtle mt-0.5">
                Manage pending team submissions for approval.
              </p>
            </div>
            
            <button 
              onClick={() => navigate('/manage-teams')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-border text-ink-muted rounded-lg text-xs font-medium border border-border transition-all shadow-sm cursor-pointer shrink-0"
            >
              <span>←</span> Back
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12 text-ink-subtle text-sm animate-pulse">
              Loading registration requests...
            </div>
          ) : futureSeasons.length === 0 ? (
            <div className="text-center py-12 px-4 bg-canvas rounded-xl border border-dashed border-border text-ink-subtle text-sm">
              No upcoming seasons found.
            </div>
          ) : (
            /* Season & Request List */
            <div className="flex flex-col gap-8">
              {futureSeasons.map((season) => {
                const seasonRequests = pendingRequests.filter(r => r.seasonId === season.id);
                const comp = competitions.find(c => c.id === season.competitionId);
                const headerTitle = comp ? `${comp.name} - ${season.name}` : season.name;

                return (
                  <div key={season.id} className="flex flex-col gap-3">
                    {/* Season Section Title */}
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <h3 className="text-base font-bold text-ink">
                        {headerTitle}
                      </h3>
                      <span className="text-xs font-semibold text-ink-subtle bg-muted px-2.5 py-0.5 rounded-full border border-border">
                        {seasonRequests.length} Pending
                      </span>
                    </div>

                    {/* Request Items */}
                    {seasonRequests.length === 0 ? (
                      <p className="text-xs text-ink-subtle italic py-2">
                        No pending registration requests for this season.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {seasonRequests.map((req) => (
                          <button
                            key={req.id || req.name}
                            onClick={() => setSelectedRequest(req)}
                            className="w-full p-4 bg-canvas hover:bg-primary-50/50 border border-border hover:border-primary-400 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer group"
                          >
                            <div>
                              <h4 className="text-sm font-semibold text-ink group-hover:text-primary-700 transition-colors">
                                {req.name || req.teamName || req.clubName || 'Untitled Request'}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-xs text-ink-subtle">
                                {req.clubName && <span>Club: {req.clubName}</span>}
                                {req.clubName && req.division && <span>•</span>}
                                {req.division && <span>Division: {req.division}</span>}
                              </div>
                            </div>

                            <span className="text-xs font-medium text-warning bg-warning-bg px-2.5 py-1 rounded-md border border-warning-border/60 shrink-0 group-hover:bg-primary-100 group-hover:text-primary-800 group-hover:border-primary-200 transition-colors">
                              Pending Review →
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
}

export default ReviewRequests;
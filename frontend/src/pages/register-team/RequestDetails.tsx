import { useState, useEffect } from 'react';
import fetchApi from '../../lib/api';
import { patchApi } from '../../lib/api';
import type { NamedRef, Player, Format, Section, TeamRequest } from './types';

interface RequestDetailsProps {
  request: TeamRequest;
  onBack: () => void;
}

function RequestDetails({ request, onBack }: RequestDetailsProps) {

  const [club, setClub] = useState<NamedRef | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [format, setFormat] = useState<Format | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);


  async function deny(){
    // call the deny endpoint
    await patchApi('/teams/deny/' + request.id);

    // refresh to see the other pending requests
    window.location.reload();
  }

  async function approve(){
    await patchApi('/teams/approve/' + request.id, {sectionId: selectedSectionId});
    
    window.location.reload();
  }


  useEffect(() => {
    async function getData(){
      if (!request){
        return null;
      }
      
      let teamPlayers: Player[] = [];
      if (request.players && Array.isArray(request.players)) {
        for (let i = 0; i < request.players.length; i++){
          teamPlayers.push(await fetchApi('/players/' + request.players[i].personId));
        }
      }
      setPlayers(teamPlayers);

      setFormat(await fetchApi('/formats/' + request.formatId));

      let allSectionIds = (await fetchApi('/sections?seasonId=' + request.seasonId)).map((s: Section) => s.id);

      let allSections: Section[] = [];
      for (let i = 0; i < allSectionIds.length; i++){
        allSections.push(await fetchApi('/sections/' + allSectionIds[i]));
      }

      let sectionsMatchingFormat: Section[] = [];
      for (let i = 0; i < allSections.length; i++){
        if (allSections[i].formatId === request.formatId){
          sectionsMatchingFormat.push(allSections[i]);
        }
      }
      setSections(sectionsMatchingFormat);

      setClub(await fetchApi('/clubs/' + request.clubId));
    }
    getData();
  }, [request]);

  if (!request){
    return null;
  }

  if (!club){
    return (
      <div className="text-center py-12 text-ink-subtle text-sm animate-pulse">
        Loading details...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Sub-Header Bar with Back to List Button */}
      <div className="pb-4 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">
            Registration Details
          </h2>
          <p className="text-sm text-ink-subtle mt-0.5">
            Review team submission specifications before approving or denying.
          </p>
        </div>

        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-border text-ink-muted rounded-lg text-xs font-medium border border-border transition-all shadow-sm cursor-pointer shrink-0"
        >
          <span>←</span> Back to List
        </button>
      </div>

      {/* Status Badge & Title Banner */}
      <div className="p-5 bg-canvas border border-border rounded-xl flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Team Name
          </span>
          <h3 className="text-xl font-bold text-ink mt-0.5">
            {request.name || 'Untitled Team'}
          </h3>
        </div>

        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
          request.pending 
            ? 'bg-warning-bg text-warning border-warning-border' 
            : request.teamId 
            ? 'bg-success-bg text-success border-success-border' 
            : 'bg-danger-bg text-danger border-danger-border'
        }`}>
          {request.pending ? 'Pending Review' : request.teamId ? 'Approved' : 'Denied'}
        </span>
      </div>

      {/* Key Attribute Grid (3 items: Club, Format, Gender) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-canvas/50 border border-border/80 rounded-xl">
          <p className="text-xs font-medium text-ink-subtle uppercase tracking-wider">Club</p>
          <p className="text-sm font-semibold text-ink mt-1">{club?.name || 'N/A'}</p>
        </div>

        <div className="p-4 bg-canvas/50 border border-border/80 rounded-xl">
          <p className="text-xs font-medium text-ink-subtle uppercase tracking-wider">Format</p>
          <p className="text-sm font-semibold text-ink mt-1">{format?.name || 'N/A'}</p>
        </div>

        <div className="p-4 bg-canvas/50 border border-border/80 rounded-xl">
          <p className="text-xs font-medium text-ink-subtle uppercase tracking-wider">Team Gender</p>
          <p className="text-sm font-semibold text-ink mt-1 uppercase">{request.teamGender || 'N/A'}</p>
        </div>
      </div>

      {/* Players List (Placed before Section Comment & Radio Buttons) */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-ink">
            Registered Players
          </h4>
          <span className="text-xs font-semibold text-ink-subtle bg-muted px-2 py-0.5 rounded-md border border-border">
            {players.length} Total
          </span>
        </div>

        {players.length === 0 ? (
          <p className="text-xs text-ink-subtle italic py-2">
            No players attached to this request.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {players.map((p, index) => {
              const firstName = p.firstName || p.first_name || '';
              const lastName = p.lastName || p.last_name || '';
              const fullName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (p.name || `Player #${index + 1}`);

              return (
                <div 
                  key={p.id || index}
                  className="p-3 bg-canvas border border-border rounded-xl flex items-center justify-between text-xs"
                >
                  <p className="font-semibold text-ink">
                    {fullName}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section Comment */}
      {request.sectionComment && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border pt-4">
          <h4 className="text-xs font-bold text-ink-subtle uppercase tracking-wider">Section Comment</h4>
          <div className="p-4 bg-canvas border border-border rounded-xl text-xs text-ink-muted whitespace-pre-line">
            {request.sectionComment}
          </div>
        </div>
      )}

      {/* Sections Radio Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <h4 className="text-xs font-bold text-ink-subtle uppercase tracking-wider">Select Section</h4>
        {sections.length === 0 ? (
          <p className="text-xs text-ink-subtle italic">No sections available for this format.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sections.map((sec) => (
              <label 
                key={sec.id}
                className="flex items-center gap-3 p-3 bg-canvas hover:bg-muted border border-border rounded-xl cursor-pointer text-xs font-semibold text-ink transition-all"
              >
                <input 
                  type="radio" 
                  name="sectionSelection"
                  value={sec.id}
                  checked={selectedSectionId === sec.id}
                  onChange={() => setSelectedSectionId(sec.id)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-border-strong"
                />
                <span>{sec.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-6 border-t border-border">
        <button 
          disabled={!selectedSectionId}
          onClick={() => {
            approve();
          }}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
            !selectedSectionId 
              ? 'bg-border text-ink-subtle cursor-not-allowed opacity-75' 
              : 'bg-success hover:bg-success text-white cursor-pointer'
          }`}
        >
          Approve Request
        </button>

        <button 
          onClick={() => {
            deny();
          }}
          className="flex-1 py-2.5 bg-danger hover:bg-danger text-white rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer"
        >
          Deny Request
        </button>
      </div>

    </div>
  );
}

export default RequestDetails;

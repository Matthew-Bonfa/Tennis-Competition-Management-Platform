import {useState, useEffect} from 'react';
import { Registration } from './Registration';
import fetchApi from '../../lib/api'
import type { NamedRef, Season } from './types';

function SelectCompetition() {

  const [associations, setAssociations] = useState<NamedRef[]>([]);
  const [selectedAssociation, setSelectedAssociation] = useState<NamedRef | undefined>();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  useEffect(() => {
    async function fetchAssociations(){
      let data = await fetchApi("/associations");
      setAssociations(data);
      setSelectedAssociation(data[0]);
    }
    fetchAssociations();
  }, []);

  useEffect(() => {    
    async function fetchFutureSeasons(){
      if (!selectedAssociation){
        return;
      }
      let competitions = await fetchApi("/competitions?associationId=" + selectedAssociation.id);
      let futureSeasons: Season[] = [];
      let now = new Date("2026-06-15T00:00:00Z");
      for (let i = 0; i < competitions.length; i++){
        let seasons = await fetchApi("/seasons?competitionId=" + competitions[i].id);
        for (let j = 0; j < seasons.length; j++){
          let start = new Date(seasons[j].startDate);
          if (start > now){
            futureSeasons.push({...seasons[j], name: competitions[i].name + " - " + seasons[j].name});
          }
        }
      }
      setSeasons(futureSeasons);
    }
    fetchFutureSeasons();
  }, [selectedAssociation]);


  if (!selectedSeason) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-surface rounded-2xl shadow-md border border-border font-sans text-ink">

        {/* Header / Title */}
        <div className="mb-7 pb-4 border-b border-border">
          <h2 className="text-2xl font-bold text-ink mb-1">
            Select Season & Association
          </h2>
          <p className="text-sm text-ink-subtle">
            Choose an association and season to begin team registration.
          </p>
        </div>

        <div className="flex flex-col gap-6">

          {/* Association Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="w-full sm:w-36 text-sm font-semibold text-ink-muted">
              Association
            </label>
            <div className="flex-1">
              <select
                /* Pre-existing mismatch (NOT fixed here): the state is seeded with an
                   association object from the API, but the select reads/writes a plain
                   string id. The casts keep the existing runtime behaviour exactly. */
                value={selectedAssociation as unknown as string}
                onChange={(e) => setSelectedAssociation(e.target.value as unknown as NamedRef)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface transition-all"
              >
                <option value="" disabled>--Select an association--</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>{assoc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Season Selection Options (Single Column) */}
          <div className="flex flex-col gap-3 mt-2 pt-5 border-t border-dashed border-border">
            <label className="block text-sm font-semibold text-ink-muted text-center sm:text-left">
              Register a team for the season
            </label>
            <div className="flex flex-col gap-3">
              {seasons.map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedSeason(s)}
                  className="w-full p-4 bg-canvas hover:bg-primary-50 border border-border hover:border-primary-500 text-ink hover:text-primary-700 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-between group"
                >
                  <span>{s.name}</span>
                  <span className="text-ink-subtle group-hover:text-primary-600 transition-colors">→</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    );
  } else {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-surface rounded-2xl shadow-md border border-border font-sans text-ink">

        {/* Header Bar with Back Button */}
        <div className="mb-6 pb-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink">
              {selectedSeason.name}
            </h2>
          </div>
          
          <button 
            onClick={() => setSelectedSeason(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-border text-ink-muted rounded-lg text-xs font-medium border border-border transition-all shadow-sm"
          >
            <span>←</span> Change Season
          </button>
        </div>

        {/* Registration Form Component. `selectedAssociation` is guaranteed here:
            the season list only populates once an association is selected. */}
        <Registration season={selectedSeason} association={selectedAssociation!} />

      </div>
    );
  }




}

export default SelectCompetition;

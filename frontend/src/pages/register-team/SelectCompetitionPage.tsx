import {useState, useEffect} from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
      <div className="mx-4 my-8 max-w-2xl p-8 bg-surface border border-border rounded-lg shadow-sm sm:mx-auto">

        {/* Header / Title */}
        <div className="mb-7 pb-4 border-b border-border">
          <h2 className="text-3xl font-bold text-ink mb-1">
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
                className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  className="w-full p-4 bg-canvas hover:bg-surface border border-border text-ink rounded-lg font-medium transition-colors flex items-center justify-between group"
                >
                  <span>{s.name}</span>
                  <ArrowRight className="h-5 w-5 text-ink-subtle group-hover:text-primary-600 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    );
  } else {
    return (
      <div className="mx-4 my-8 max-w-2xl p-8 bg-surface border border-border rounded-lg shadow-sm sm:mx-auto">

        {/* Header Bar with Back Button */}
        <div className="mb-6 pb-4 border-b border-border flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div>
            <h2 className="text-3xl font-bold text-ink">
              {selectedSeason.name}
            </h2>
          </div>

          <button
            onClick={() => setSelectedSeason(null)}
            className="inline-flex min-h-11 items-center gap-1.5 border border-border bg-muted text-ink-muted font-medium px-3 py-1.5 rounded-lg hover:bg-border transition-colors text-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Change Season
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

import {useState, useEffect} from 'react';
import { Registration } from './Registration';
import fetchApi from '../api'

function SelectCompetition() {
  
  const [associations, setAssociations] = useState([]);
  const [selectedAssociation, setSelectedAssociation] = useState();

  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);

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
      let futureSeasons = [];
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
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-2xl shadow-md border border-slate-100 font-sans text-slate-800">

        {/* Header / Title */}
        <div className="mb-7 pb-4 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Select Season & Association
          </h2>
          <p className="text-sm text-slate-500">
            Choose an association and season to begin team registration.
          </p>
        </div>

        <div className="flex flex-col gap-6">

          {/* Association Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="w-full sm:w-36 text-sm font-semibold text-slate-700">
              Association
            </label>
            <div className="flex-1">
              <select 
                value={selectedAssociation} 
                onChange={(e) => setSelectedAssociation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              >
                <option value="" disabled>--Select an association--</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>{assoc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Season Selection Options (Single Column) */}
          <div className="flex flex-col gap-3 mt-2 pt-5 border-t border-dashed border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 text-center sm:text-left">
              Register a team for the season
            </label>
            <div className="flex flex-col gap-3">
              {seasons.map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedSeason(s)}
                  className="w-full p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-500 text-slate-800 hover:text-blue-700 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-between group"
                >
                  <span>{s.name}</span>
                  <span className="text-slate-400 group-hover:text-blue-600 transition-colors">→</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    );
  } else {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-2xl shadow-md border border-slate-100 font-sans text-slate-800">

        {/* Header Bar with Back Button */}
        <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedSeason.name}
            </h2>
          </div>
          
          <button 
            onClick={() => setSelectedSeason(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-all shadow-sm"
          >
            <span>←</span> Change Season
          </button>
        </div>

        {/* Registration Form Component */}
        <Registration season={selectedSeason} association={selectedAssociation} />

      </div>
    );
  }




}

export default SelectCompetition;

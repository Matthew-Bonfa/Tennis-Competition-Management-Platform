import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import fetchApi from '../../lib/api';
import { postApi } from '../../lib/api';
import type { NamedRef, Season, Section, Format, Player } from './types';

export function Registration({season, association}: {season: Season; association: NamedRef}){
  const navigate = useNavigate();


  const [sections, setSections] = useState<Section[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);

  const [clubs, setClubs] = useState<NamedRef[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClubs, setFilteredClubs] = useState<NamedRef[]>([]);
  const [selectedClub, setSelectedClub] = useState<NamedRef | null>(null);

  const [teamName, setTeamName] = useState("");

  const [playerText, setPlayerText] = useState<string[]>([]);
  const [updatedPlayer, setUpdatedPlayer] = useState<number | null>(null);
  const [playerResults, setPlayerResults] = useState<Player[]>([]);

  const [players, setPlayers] = useState<(Player | null)[]>([]);

  const [gender, setGender] = useState("");

  const [sectionComment, setSectionComment] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  function selectPlayer(i: number, player: any){
    let playersCopy = [...players];
    playersCopy[i] = player;
    setPlayers(playersCopy);
    
    let textCopy = [...playerText];
    textCopy[i] = player.firstName + " " + player.lastName;
    setPlayerText(textCopy);

    setPlayerResults([]);
  }

  useEffect(() => {
    let morePlayers = [...players]
    for (let i = 0; i < playerText.length - players.length; i++){
      morePlayers.push(null);
    }
    setPlayers(morePlayers)
  }, [playerText]);

  function updatePlayerText(i: number, text: string){
    async function getPlayersFromSearch(){
      /* Pre-existing bug (NOT fixed here): `updatedPlayer` still holds the previous
         index at this point, so the search uses the previous player's text. The
         assertion only satisfies the type checker. */
      let data = await fetchApi('/players?search=' + playerText[updatedPlayer!]);
      setPlayerResults(data);
    }

    let playersCopy = [...players];
    playersCopy[i] = null;
    setPlayers(playersCopy);

    let list = [...playerText];
    list[i] = text;
    setUpdatedPlayer(i);
    setPlayerText(list);
    getPlayersFromSearch();
  }


  useEffect(() => {
    if (!selectedFormat){
      return;
    }
    let text: string[] = [];
    let p: (Player | null)[] = [];
    let min = 1;
    if (selectedFormat !== null && selectedFormat.minPlayers > 1){
      min = selectedFormat.minPlayers;
    }
    for (let i = 0; i < min; i++){
      text.push("");
      p.push(null);
    }
    setPlayerText(text);
    setPlayers(p);
  }, [selectedFormat]);



  useEffect(() => {
    if (!selectedClub || selectedClub.name !== searchTerm){
      setSelectedClub(null);
      let filtered: NamedRef[] = [];
      for (let i = 0; i < clubs.length; i++){
        if (clubs[i].name.toLowerCase().includes(searchTerm.toLowerCase())){
          filtered.push(clubs[i]);
        }
      }
      setFilteredClubs(filtered);
    }
  }, [searchTerm]);
  

  function selectClub(club: any){
    setSelectedClub(club);
    setSearchTerm(club.name);
    setFilteredClubs([]);
  }


  useEffect(() => {
    async function fetchSections(){
      let data = await fetchApi('/sections?seasonId=' + season.id);
      let fullSections: Section[] = [];
      for (let i = 0; i < data.length; i++){
        fullSections.push(await fetchApi('/sections/' + data[i].id));
      }
      setSections(fullSections);
    }
    fetchSections();
  }, []);

  useEffect(() => {
    async function getFormats(){
      let formatIds: string[] = [];
      for (let i = 0; i < sections.length; i++){
        formatIds.push(sections[i].formatId);
      }

      let sectionFormats: Format[] = [];
      for (let i = 0; i < formatIds.length; i++){
        let format = await fetchApi('/formats/' + formatIds[i])
        sectionFormats.push(format);
      }
      setFormats(sectionFormats);
    }
    getFormats();
  }, [sections]);



  useEffect(() => {
    async function getClubs(){
      const data = await fetchApi('/clubs?associationId=' + association.id);
      setClubs(data);
      setFilteredClubs(data);
    }
    getClubs();
  }, []);



  async function submit(){

    // check there is a club
    if (!selectedClub){
      setErrorMessage("No club selected")
      return;
    }

    // check there is a team name
    if (teamName.trim().length === 0){
      setErrorMessage("Must provide a team name");
      return;
    }

    // check there is a format
    if (!selectedFormat){
      setErrorMessage("No format selected");
      return;
    }
    
    // check the number of players and that they are unique
    let nonemptyPlayers: Player[] = [];
    for (let i = 0; i < players.length; i++){
      const player = players[i];
      if (player !== null){
        nonemptyPlayers.push(player);
      }
    }
    const actualPlayers = nonemptyPlayers.filter((player, index, self) =>
      index === self.findIndex((p) => p.id === player.id)
    );


    console.log(actualPlayers);
    if (actualPlayers.length < selectedFormat.minPlayers){
      setErrorMessage(`Not enough players. You must enter at least ${selectedFormat.minPlayers}`);
      return;
    }

    // team gender vs format gender
    if (!selectedFormat.permittedGenders.includes(gender)){
      let gendersTranslation: string[] = [];
      if (selectedFormat.permittedGenders.includes("boys")){
        gendersTranslation.push("Men's");
      }
      if (selectedFormat.permittedGenders.includes("girls")){
        gendersTranslation.push("Women's");
      }
      if (selectedFormat.permittedGenders.includes("open")){
        gendersTranslation.push("Mixed");
      }
      setErrorMessage('This format only accepts teams of gender: ' + gendersTranslation.join(" or "));
      return;
    }
    
    // check there is a comment
    if (sectionComment.trim().length === 0){
      setErrorMessage('Must provide a section comment');
      return;
    }

    // form the request call
    // {clubId: string, seasonId: number, sectionComment: string, formatId: string, name: string, players: [{personId: string}]}
    
    let newTeamRequest = {
      clubId: selectedClub.id,
      seasonId: season.id,
      sectionComment: sectionComment,
      formatId: selectedFormat.id,
      name: teamName,
      teamGender: gender,
      players: actualPlayers.map(p => ({
        personId: p.id
      })),
    }

    await postApi('/teams/register', newTeamRequest);


    navigate('/manage-teams');
  }

  return (
    <div className="mx-4 my-8 max-w-2xl p-8 bg-surface border border-border rounded-lg shadow-sm sm:mx-auto">

      {/* Header / Title */}
      <div className="mb-7 pb-4 border-b border-border">
        <h2 className="text-3xl font-bold text-ink mb-1">
          Team Registration
        </h2>
        <p className="text-sm text-ink-subtle">
          Complete the details below to register your team.
        </p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Club Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label htmlFor="club-search" className="w-full sm:w-36 text-sm font-semibold text-ink-muted">
            Choose a club
          </label>
          <div className="relative flex-1">
            <input
              id="club-search"
              type="text"
              placeholder="Search for a club..."
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            {searchTerm && filteredClubs.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded-lg shadow-md max-h-44 overflow-y-auto z-10 mt-1">
                {filteredClubs.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => selectClub(c)}
                    className="flex min-h-11 items-center w-full px-4 py-2.5 text-left bg-transparent border-b border-border last:border-b-0 hover:bg-canvas text-ink transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Name */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label htmlFor="team-name" className="w-full sm:w-36 text-sm font-semibold text-ink-muted">
            Team name:
          </label>
          <div className="flex-1">
            <input
              id="team-name"
              placeholder="Enter team name"
              value={teamName} 
              onChange={(e) => setTeamName(e.target.value)} 
              className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Format Select */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label htmlFor="team-format" className="w-full sm:w-36 text-sm font-semibold text-ink-muted">
            Format
          </label>
          <div className="flex-1">
            <select
              id="team-format"
              value={selectedFormat ? selectedFormat.id : ""} 
              onChange={(e) => setSelectedFormat(formats.find(f => f.id === e.target.value) ?? null)}
              className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="" disabled>--Select a format--</option>
              {formats.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedFormat && (
          <div className="flex flex-col gap-5 mt-2 pt-5 border-t border-dashed border-border">

            {/* Players List */}
            <div className="flex flex-col gap-3">

              {/* Centered Select Players & Minimum Requirement Message */}
              <div className="bg-canvas p-3.5 rounded-lg border border-border text-center mb-1">
                <h3 className="text-sm font-bold text-ink mb-0.5">
                  Select Players
                </h3>
                <p className="text-xs text-ink-subtle">
                  Minimum required: <span className="font-semibold text-ink-muted">{selectedFormat.minPlayers ?? selectedFormat.min ?? 1}</span> player(s)
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {Array.from({ length: playerText.length }).map((_, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label htmlFor={`player-${index}`} className="w-full sm:w-36 text-sm font-semibold text-ink-muted">
                      Player {index + 1}
                    </label>
                    <div className="relative flex-1">
                      <input
                        id={`player-${index}`}
                        placeholder={`Player ${index + 1} Name`}
                        value={playerText[index]} 
                        onChange={(e) => updatePlayerText(index, e.target.value)} 
                        className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {updatedPlayer === index && playerResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded-lg shadow-md max-h-36 overflow-y-auto z-10 mt-1">
                          {playerResults.map(p => (
                            <button 
                              key={p.id} 
                              onClick={() => selectPlayer(index, p)}
                              className="flex min-h-11 items-center w-full px-4 py-2 text-left bg-transparent border-b border-border last:border-b-0 hover:bg-canvas text-ink transition-colors"
                            >
                              {p.firstName + " " + p.lastName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedFormat && (playerText.length < selectedFormat.maxPlayers) && (
                <div className="flex sm:pl-40">
                  <button 
                    onClick={() => setPlayerText([...playerText, ""])}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    Add Player
                  </button>
                </div>
              )}
            </div>

            {/* Team Gender */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-ink-muted text-center mb-1">
                What is this team's gender?
              </p>
              <div role="radiogroup" aria-label="Team gender" className="flex justify-center gap-4">
                {[
                  { id: 'boys', label: "Men's" },
                  { id: 'open', label: 'Mixed' },
                  { id: 'girls', label: "Women's" }
                ].map((option) => (
                  <label 
                    key={option.id} 
                    className={`flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                      gender === option.id 
                        ? 'border-primary-600 bg-primary-50 font-semibold text-primary-700' 
                        : 'border-border-strong bg-surface text-ink-muted hover:bg-canvas'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="gender" 
                      value={option.id} 
                      onChange={() => setGender(option.id)} 
                      checked={gender === option.id}
                      className="accent-primary-600"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Section Information & Comment */}
            <div className="bg-canvas p-4 rounded-lg border border-border">
              <p className="text-xs font-semibold text-ink-subtle uppercase tracking-wider mb-2 text-center">
                sections with this format
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {sections.filter(s => s.formatId === selectedFormat.id).map(s => (
                  <span 
                    key={s.id} 
                    className="px-3 py-1 bg-surface border border-border rounded-full text-xs text-ink-muted font-medium"
                  >
                    {s.name}
                  </span>
                ))}
              </div>

              <label htmlFor="section-comment" className="block text-sm font-semibold text-ink-muted mb-1.5 text-center">
                Please leave a comment about the team's ability and preferred section
              </label>
              <textarea
                id="section-comment"
                rows={3}
                value={sectionComment} 
                onChange={(e) => setSectionComment(e.target.value)} 
                placeholder="Enter your comment here..."
                className="w-full rounded-lg border border-border-strong bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>

            {/* Error & Submit */}
            <div className="mt-2">
              {errorMessage && (
                <div className="text-danger text-sm font-medium mb-3 text-center">
                  {errorMessage}
                </div>
              )}
              <button 
                onClick={() => submit()}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Submit
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );

}
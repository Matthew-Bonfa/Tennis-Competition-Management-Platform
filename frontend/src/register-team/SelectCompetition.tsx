import {useState, useEffect} from 'react';
import {ALL_COMPETITIONS} from '../mock-data/MockCompetitions'
import fetchApi from '../api'

function SelectCompetition() {
  
  const [associations, setAssociations] = useState([]);
  useEffect(() => {

    async function fetchAssociations(){
      let data = await fetchApi("/associations");
      setAssociations(data);
    }
    fetchAssociations();
  }, []);

  
  
  const [selected, setSelected] = useState(associations[0]);

  const [competition, setCompetition] = useState(null);

  if (!competition){
    return (
      <div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {associations.map((assoc) => (
            <option key={assoc.id}>{assoc.name}</option>
          ))}
        </select>
        <div>
          {/* need to fix it with the actual database, including filtering by the association from the dropdown*
            also only show the ones that haven't finished yet! (as in haven't started, or in progress) */}
          {ALL_COMPETITIONS.map((comp) => (
            <button key={comp.id} onClick={() => setCompetition(comp)}>{comp.name}</button>
          ))}
        </div>
      </div>
    )
  } else {
    return (
      <div>
        <h2>{competition.name}</h2>
        <p>WILL ADD SECTION AND SEASON SELECTION WHEN I CAN</p>
      </div>
    )
  }

}

export default SelectCompetition;

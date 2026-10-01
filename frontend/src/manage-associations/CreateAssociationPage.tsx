import {useState} from 'react';
import {postApi} from '../api'
import {useNavigate} from 'react-router-dom'

function CreateAssociationPage() {
  const navigate = useNavigate();


  const [name, setName] = useState("");

  async function postAssociation() {

    const trimmedName = name.trim();
    if (trimmedName.length === 0){
      console.error("Must include a name for the association");
      return;
    }

    const data = {name: trimmedName};

    try {
      // send a POST request to the database
      const response = await postApi("/associations", data);
      console.log("it worked, created a new association with id " + response.id);
      
      navigate("/manage-associations");
    }
    catch (error){
      console.error("Something went wrong trying to POST", error);
    }

  }

  return (
    <div>
      <h1>Create New Association</h1>
      <div>
        <label>Association Name</label>
        <input type="text" maxLength={200} className="bg-white border border-black" onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label>Contact (WIP, should be a person ID, not sure best way or if it should just be an email)</label>
        <input type="text" className="bg-white border border-black" />
      </div>
      <button className="border border-black" maxLength={200} onClick={() => postAssociation()}>Create</button>
    </div>
  )
}

export default CreateAssociationPage;

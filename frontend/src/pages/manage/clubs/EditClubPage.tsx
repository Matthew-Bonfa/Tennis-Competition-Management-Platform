import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import fetchApi, { postApi } from '../../../lib/api';

interface ClubForm {
  name?: string;
  address?: string;
}

function EditClubPage(){

  const navigate = useNavigate();

  const {id} = useParams();
  let creatingNew = false;
  let startedNew = false;
  if (id === "new-club"){
    creatingNew = true;
    startedNew = true;
  }

  const [club, setClub] = useState<ClubForm>({});
  const [newClub, setNewClub] = useState<ClubForm>({});

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function getClub(){
      const response = await fetchApi("/clubs/" + id);
      setClub(response);
      setNewClub(response);
    }
    if (!creatingNew){
      getClub();
    }
  }, []);

  function submit(){
    let clubId = id;
    setErrorMessage("");

    // if you are trying to submit a new club
    if (creatingNew){
      if (!newClub.name || newClub.name.trim() === ""){
        return;
      }
      const response = postApi("/clubs", {name: newClub.name});
      /* Pre-existing bug (NOT fixed here): `postApi` is not awaited, so `response`
         is a Promise and `.id` is always undefined — the follow-up PATCH goes to
         "/clubs/undefined". The cast only satisfies the type checker; the runtime
         behaviour is unchanged. */
      clubId = (response as unknown as {id: string}).id;
      creatingNew = false;
    }

    console.log(newClub);
    let update: ClubForm[] = [];
    /* The `!` assertions are erased at build time — if `name` were ever undefined
       this still throws exactly as it did before, it just satisfies the checker. */
    if (newClub.name!.trim() !== club.name){
      if (newClub.name!.trim() === ""){
        setErrorMessage("Name can't be empty")
        return;
      }
      update.push({name: newClub.name!.trim()});
    }
    if (newClub.address !== undefined && newClub.address.trim() !== club.address){
      update.push({address: newClub.address.trim()});
    }
    console.log(update);
    if (update.length > 0){
      console.log(update);
      const updateObject = update.reduce((a, current) => ({...a, ...current}));
      postApi("/clubs/" + clubId, updateObject);
      navigate("/manage-clubs");
    }
  }


  /*
  
    still thinking about how to edit the contact person or the roles
    - i'm thinking about a small search box with the results appearing below
      but there are issues with that
      - should it just be the club members?
        like can't have a role unless you're a member?
      - what if there are 2 people with the same name?
        have to show more than just the name in the results
      - are there heaps and heaps of possible results?
        should be a server-side search
        - should it return just the first few that match?
          or all results that match? (might be too many)
        - should it request upon every change to the search field?
          or only on enter/search button?
          
  */

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      
      {/* 1. Heading OUTSIDE the bubble */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">
          {startedNew ? "New Club" : "Edit Club"}
        </h1>
      </div>

      {/* 2. Wider Form Card Bubble (Fields & Button only) */}
      <div className="bg-surface p-8 rounded-lg shadow-md border border-border">
        
        <div className="space-y-5">
          
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
            <label className="text-sm font-medium text-ink-muted sm:col-span-1 sm:text-right">
              Name
            </label>
            <div className="sm:col-span-3">
              <input 
                type="text" 
                value={newClub.name || ""} 
                onChange={e => setNewClub({...newClub, name: e.target.value})} 
                className="w-full px-3.5 py-2 border border-border-strong rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-ink"
                placeholder="Enter club name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
            <label className="text-sm font-medium text-ink-muted sm:col-span-1 sm:text-right">
              Address
            </label>
            <div className="sm:col-span-3">
              <input 
                type="text" 
                value={newClub.address || ""} 
                onChange={e => setNewClub({...newClub, address: e.target.value})} 
                className="w-full px-3.5 py-2 border border-border-strong rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-ink"
                placeholder="Enter address"
              />
            </div>
          </div>

        </div>

        {/* 3. Bottom Action Bar: Error Message (left) & Submit Button (right) */}
        <div className="mt-8 pt-4 border-t border-border flex justify-between items-center">
          <div>
            {errorMessage && (
              <span className="text-sm font-medium text-danger">
                {errorMessage}
              </span>
            )}
          </div>

          <button 
            onClick={submit}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-5 rounded-lg transition-colors shadow-sm cursor-pointer text-sm"
          >
            Submit
          </button>
        </div>

      </div>

    </div>
  );
}

export default EditClubPage;

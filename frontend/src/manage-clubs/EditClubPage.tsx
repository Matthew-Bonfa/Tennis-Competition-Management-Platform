import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import fetchApi, { postApi, patchApi } from '../api';

function EditClubPage(){

  const navigate = useNavigate();

  const {id} = useParams();
  let creatingNew = false;
  let startedNew = false;
  if (id === "new-club"){
    creatingNew = true;
    startedNew = true;
  }

  const [club, setClub] = useState({});
  const [newClub, setNewClub] = useState({});

  const [people, setPeople] = useState([]);
  const [eligibleContacts, setEligibleContacts] = useState([]);

  // Main Contact state
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);

  // Key Roles state
  const [roles, setRoles] = useState([
    { role: "", personSearch: "", selectedPerson: null, results: [] }
  ]);

  const [errorMessage, setErrorMessage] = useState("");

  // Sync contact search input when a contact is selected
  useEffect(() => {
    if (selectedContact) {
      setContactSearch(selectedContact.firstName + " " + selectedContact.lastName);
    }
  }, [selectedContact]);

  useEffect(() => {
    async function getPeopleAndClub() {
      // 1. Fetch people and eligible contacts
      let allPeople = await fetchApi("/players");
      const mappedPeople = allPeople.map(p => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName
      }));
      setPeople(mappedPeople);

      let contacts = [];
      for (let i = 0; i < allPeople.length; i++){
        let person = await fetchApi("/players/" + allPeople[i].id);
        if (person.email || person.phone){
          contacts.push({
            id: person.id,
            firstName: person.firstName,
            lastName: person.lastName,
            email: person.email,
            phone: person.phone,
          });
        }
      }
      setEligibleContacts(contacts);

      // 2. Fetch existing club data if editing
      if (!creatingNew) {
        const clubData = await fetchApi("/clubs/" + id);
        setClub(clubData);
        setNewClub(clubData);
        console.log(clubData);

        // Pre-select contact person if exists
        if (clubData.contactPerson) {
          const curContact = contacts.find(p => p.id === clubData.contactPerson.id);
          if (curContact) {
            setSelectedContact(curContact);
          }
        }

        // Pre-populate roles if exist
        if (clubData.officials && clubData.officials.length > 0) {
          let roleData = [];
          for (let i = 0; i < clubData.officials.length; i++) {
            let person = await fetchApi('/players/' + clubData.officials[i].personId);
            roleData.push({
              role: clubData.officials[i].role,
              personSearch: person.firstName + " " + person.lastName,
              selectedPerson: { id: person.id, firstName: person.firstName, lastName: person.lastName },
              results: []
            });
          }
          setRoles(roleData);
        }
      }
    }

    getPeopleAndClub();
  }, [id, creatingNew]);


  
  useEffect(() => {
    if (!selectedContact || (selectedContact.firstName + " " + selectedContact.lastName) !== contactSearch) {
      setSelectedContact(null);
      let filtered = eligibleContacts.filter(p =>
        (p.firstName + " " + p.lastName).toLowerCase().trim().includes(contactSearch.toLowerCase().trim())
      );
      setContactResults(filtered);
    }
  }, [contactSearch, eligibleContacts]);

  // Role management functions
  function updateRoleName(nameVal, i) {
    let updatedRole = {
      role: nameVal,
      personSearch: roles[i].personSearch,
      selectedPerson: roles[i].selectedPerson,
      results: roles[i].results,
    };
    let rolesCopy = [...roles];
    rolesCopy[i] = updatedRole;
    setRoles(rolesCopy);
  }

  function updateRolePerson(search, i) {
    let filtered = people.filter(p =>
      (p.firstName + " " + p.lastName).toLowerCase().trim().includes(search.toLowerCase().trim())
    );

    let updatedRole = {
      role: roles[i].role,
      personSearch: search,
      selectedPerson: null,
      results: filtered,
    };

    let rolesCopy = [...roles];
    rolesCopy[i] = updatedRole;
    setRoles(rolesCopy);
  }

  function selectRolePerson(i, person) {
    let updatedRole = {
      role: roles[i].role,
      personSearch: person.firstName + " " + person.lastName,
      selectedPerson: person,
      results: [],
    };

    let rolesCopy = [...roles];
    rolesCopy[i] = updatedRole;
    setRoles(rolesCopy);
  }

  const addRoleRow = () => {
    setRoles(prev => [
      ...prev,
      { id: Date.now(), role: "", personSearch: "", selectedPerson: null, results: [] }
    ]);
  };

  const removeRoleRow = (index) => {
    setRoles(prev => prev.filter((_, i) => i !== index));
  };

  async function submit() {
    let clubId = id;
    setErrorMessage("");

    if (newClub.name.trim().length === 0){
      setErrorMessage("Must provide a club name");
      return;
    }


    // Validate main contact search
    if (contactSearch.trim().length > 0 && !selectedContact) {
      setErrorMessage("Please select a valid contact person from the dropdown list.");
      return;
    }

    // Validate key roles rows
    for (let i = 0; i < roles.length; i++) {
      const r = roles[i];
      const hasRoleName = r.role.trim().length > 0;
      const hasPersonInput = r.personSearch.trim().length > 0;
      const hasSelectedPerson = r.selectedPerson !== null;

      if ((hasRoleName && !hasSelectedPerson) || (!hasRoleName && hasPersonInput) || (!hasRoleName && hasSelectedPerson)) {
        setErrorMessage("Each role must have both a description and a valid person selected.");
        return;
      }
    }

    const rolesList = roles
      .filter(r => r.role.trim() && r.selectedPerson)
      .map(r => ({
        role: r.role.trim(),
        personId: r.selectedPerson.id,
      }));


    const payload = {
      name: newClub.name.trim(),
      address: newClub.address ? newClub.address.trim() : null,
      contactPersonId: selectedContact ? selectedContact.id : null,
      roles: rolesList.length > 0 ? rolesList : null
    };

    // Submit new club
    if (creatingNew) {
      if (!newClub.name || newClub.name.trim() === "") {
        setErrorMessage("Name can't be empty");
        return;
      }
      try {
        await postApi("/clubs", payload);
        navigate("/manage-clubs");
      } catch (error) {
        console.error("Failed to create club:", error);
        setErrorMessage("Something went wrong creating the club.");
      }
      return;
    }



    try {
      await patchApi("/clubs/" + clubId, payload);
      navigate("/manage-clubs");
    } catch (error) {
      console.error("Failed to update club:", error);
      setErrorMessage("Something went wrong updating the club.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Heading outside the card */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        {startedNew ? "New Club" : "Edit Club"}
      </h1>

      <div className="w-full bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <div className="space-y-6 mb-8">
          
          {/* Name Row */}
          <div className="flex items-center gap-4">
            <label className="w-36 shrink-0 text-right text-sm font-medium text-gray-700 whitespace-nowrap leading-none">
              Club Name
            </label>
            <input 
              type="text" 
              maxLength={200}
              value={newClub.name || ""} 
              onChange={e => setNewClub({...newClub, name: e.target.value})} 
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              placeholder="Enter club name"
            />
          </div>

          {/* Address Row */}
          <div className="flex items-center gap-4">
            <label className="w-36 shrink-0 text-right text-sm font-medium text-gray-700 whitespace-nowrap leading-none">
              Address
            </label>
            <input 
              type="text" 
              maxLength={250}
              value={newClub.address || ""} 
              onChange={e => setNewClub({...newClub, address: e.target.value})} 
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              placeholder="Enter address"
            />
          </div>

          {/* Primary Contact Row */}
          <div className="flex items-start gap-4">
            <label className="w-36 shrink-0 text-right text-sm font-medium text-gray-700 whitespace-nowrap pt-3 leading-none">
              Contact Person
            </label>
            <div className="w-full relative">
              <input 
                type="text" 
                placeholder="e.g. contact@example.com or Person ID"
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />

              {/* Display search results only when no contact is selected and user is typing */}
              {selectedContact === null && contactSearch.trim().length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {contactResults.length > 0 ? (
                    contactResults.map((contact) => (
                      <div 
                        key={contact.id} 
                        onClick={() => setSelectedContact(contact)} 
                        className="p-3 hover:bg-gray-50 transition-colors text-sm flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900 truncate">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 shrink-0">
                          {contact.email && <span>{contact.email}</span>}
                          {contact.email && contact.phone && <span className="text-gray-300">•</span>}
                          {contact.phone && <span>{contact.phone}</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-gray-500">No matching contacts found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Key Roles Section */}
          <div className="flex items-start gap-4 pt-2 border-t border-gray-100">
            <label className="w-36 shrink-0 text-right text-sm font-medium text-gray-700 whitespace-nowrap pt-3 leading-none">
              Key Roles
            </label>
            <div className="w-full space-y-3">
              {roles.map((role, index) => (
                <div key={index} className="flex items-center gap-3">
                  {/* Role Name Input */}
                  <input
                    type="text"
                    placeholder="Role"
                    value={role.role}
                    onChange={(e) => updateRoleName(e.target.value, index)}
                    className="w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  />

                  {/* Person Search Input */}
                  <div className="w-1/2 relative">
                    <input
                      type="text"
                      placeholder="Person"
                      value={role.personSearch}
                      onChange={(e) => updateRolePerson(e.target.value, index)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    />

                    {/* Role Person Search Dropdown (Name only) */}
                    {role.selectedPerson === null && role.personSearch.trim().length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                        {role.results.length > 0 ? (
                          role.results.map((person) => (
                            <div
                              key={person.id}
                              onClick={() => selectRolePerson(index, person)}
                              className="p-2.5 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                            >
                              <div className="font-medium text-gray-900 truncate">
                                {person.firstName} {person.lastName}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-2.5 text-xs text-gray-500">No matching contacts found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delete Row Button */}
                  {roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoleRow(index)}
                      className="px-2.5 py-2 text-gray-400 hover:text-red-600 transition-colors text-sm font-bold"
                      title="Remove role"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addRoleRow}
                className="mt-2 text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
              >
                + Add another role
              </button>
            </div>
          </div>

        </div>

        {/* Action Button and Error Message side-by-side */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <button 
            onClick={submit}
            className="px-5 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-sky-700 transition-colors shrink-0 cursor-pointer"
          >
            {startedNew ? "Create" : "Save"}
          </button>

          {errorMessage && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default EditClubPage;
// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import {useState, useEffect} from 'react'
import { useParams, Link } from 'react-router-dom';
import { Trophy, Building2 } from 'lucide-react';

import fetchApi from './api.js'

import { ASSOCIATIONS } from './mock-data/MockAssociations';

import './AssociationProfile.css'

function AssociationProfile() {

  const id = window.location.pathname.split("/").at(-1);
  
  const [association, setAssociation] = useState();
  const [clubs, setClubs] = useState();

  useEffect(() => {
    async function fetchAssociation(){
        let data = await fetchApi("/associations/" + id);

        console.log(data);

        setAssociation(data);        
    }

    fetchAssociation();
  }, []);


  useEffect(() => {
    async function fetchClubs(){
      console.log("gonna ask for all the clubs");
      let data = await fetchApi("/clubs");
      console.log("asked for all clubs");
      console.log(data);

      setClubs(data);
    }

    fetchClubs();
  }, []);
  
  

  if (!association) {
    return <div className="p-8 text-center text-gray-600">Association not found.</div>;
  }


  return (
    <div>
      <Link key={association.id} to={`/associations/`}>
        <h2>Back to Associations</h2>
      </Link>
      <h1>{association.name}</h1>
      <p>Contact Person: {association.contactPerson.firstName} {association.contactPerson.lastName}</p>
      <p>Still need to connect to competitions and maybe contact person (if they get a page)</p>

      <div className="split">
        <div>
          <h2>Clubs</h2>
          <div>
            {clubs?.map((club) => (
              <Link 
                  key={club.id}
                  to={`/clubs/` + club.id}
                  className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3>{club.name}</h3>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2>Competitions</h2>
        </div>
      </div>

    </div>
  );
}

export default AssociationProfile;
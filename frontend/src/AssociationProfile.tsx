// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import {useState, useEffect} from 'react'
import { useParams, Link } from 'react-router-dom';
import { Trophy, Building2 } from 'lucide-react';

import fetchApi from './api.js'

import { ASSOCIATIONS } from './mock-data/MockAssociations';

function AssociationProfile() {

  const id = window.location.pathname.split("/").at(-1);
  
  const [association, setAssociation] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function fetchAssociation(){
        let data = await fetchApi("/associations/" + id);

        console.log(data);

        setAssociation(data);
        setLoading(false);
        
    }

    fetchAssociation();
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
      <p>Still need to connect to: clubs, competitions and contact person (if they get a page)</p>
    </div>
  );
}

export default AssociationProfile;
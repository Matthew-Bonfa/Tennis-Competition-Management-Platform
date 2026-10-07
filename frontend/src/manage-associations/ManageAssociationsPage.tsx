import {Link} from 'react-router-dom';
import {useState, useEffect} from 'react'

import {EditAssociation} from './EditAssociation'
import fetchApi from '../api.ts'

function ManageAssociationsPage() {


  const [associations, setAssociations] = useState([]);

  const [selectedAssociationId, setSelectedAssociationId] = useState();


 
  // get every association for the dropdown
  useEffect(() => {
    async function getAssociations(){
      const response = await fetchApi("/associations");
      setAssociations(response);
      if (response[0]){
        setSelectedAssociationId(response[0].id);
      }
      
    }
    getAssociations();
  }, []);
  
  
  if (!associations[0]){
    return;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Associations</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-grow max-w-xl">
          <label htmlFor="association-select" className="w-36 shrink-0 text-sm font-medium text-gray-700 whitespace-nowrap">
            Select Association:
          </label>
          <select
            id="association-select"
            value={selectedAssociationId}
            onChange={(e) => setSelectedAssociationId(e.target.value)}
            className="block w-full border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
          >
            {associations.map(assoc => (
              <option key={assoc.id} value={assoc.id}>{assoc.name}</option>
            ))}
          </select>
        </div>

        <Link 
          to="/manage-associations/create-new-association"
          className="inline-flex items-center justify-center px-4 py-3 bg-sky-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-sky-700 transition-colors shrink-0"
        >
          + New Association
        </Link>
      </div>

      <EditAssociation key={selectedAssociationId} association={associations.find(a => a.id === selectedAssociationId)} setAssociation={(a) => setAssociation(a)} />
    </div>
  );
}

export default ManageAssociationsPage;

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Centered Title outside the card */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Create New Association
      </h1>

      <div className="w-full bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <div className="space-y-6 mb-8">
          {/* Association Name Row */}
          <div className="flex items-center gap-4">
            <label className="w-36 shrink-0 text-right text-sm font-medium text-gray-700 whitespace-nowrap leading-none">
              Association Name
            </label>
            <input 
              type="text" 
              maxLength={200} 
              placeholder="Enter association name"
              onChange={(e) => setName(e.target.value)} 
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>

          {/* Contact Row */}
          <div className="flex items-start gap-4">
            <label className="w-36 shrink-0 text-right text-sm font-medium text-gray-700 whitespace-nowrap pt-3 leading-none">
              Contact
            </label>
            <div className="w-full">
              <input 
                type="text" 
                placeholder="e.g. contact@example.com or Person ID"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
              <span className="block mt-1.5 text-xs text-gray-500">
                WIP: enter email address or person ID
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={() => postAssociation()} 
            className="px-5 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-sky-700 transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAssociationPage;

import {useState} from 'react';
import {postApi} from '../../../lib/api'
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
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Centered Title outside the card */}
      <h1 className="text-3xl font-bold text-ink mb-8 text-center">
        Create New Association
      </h1>

      <div className="w-full bg-surface border border-border rounded-lg p-8 shadow-sm">
        <div className="space-y-6 mb-8">
          {/* Association Name Row */}
          <div className="flex items-center gap-4">
            <label htmlFor="association-name" className="w-36 shrink-0 text-right text-sm font-medium text-ink-muted whitespace-nowrap leading-none">
              Association Name
            </label>
            <input
              id="association-name"
              type="text"
              maxLength={200} 
              placeholder="Enter association name"
              onChange={(e) => setName(e.target.value)} 
              className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Contact Row */}
          <div className="flex items-start gap-4">
            <label htmlFor="association-contact" className="w-36 shrink-0 text-right text-sm font-medium text-ink-muted whitespace-nowrap pt-3 leading-none">
              Contact
            </label>
            <div className="w-full">
              <input
                id="association-contact"
                type="text"
                placeholder="e.g. contact@example.com or Person ID"
                className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="block mt-1.5 text-xs text-ink-subtle">
                WIP: enter email address or person ID
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={() => postAssociation()} 
            className="bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAssociationPage;

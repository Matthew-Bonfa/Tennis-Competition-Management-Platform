import {useState, useRef} from 'react';
import fetchApi, {postApi, patchApi} from '../../../lib/api'
import {useNavigate} from 'react-router-dom'
import PersonPicker from "../../../components/manage/PersonPicker";
import {X} from "lucide-react";

function CreateAssociationPage() {
  const navigate = useNavigate();


  const [name, setName] = useState("");

  const [contactPerson, setContactPerson] = useState<ContactPerson | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const emailDirty = useRef(false);
  const phoneDirty = useRef(false);

  const [msg, setMsg] = useState("");



  function pickContact(person: PickedPerson) {
    emailDirty.current = false;
    phoneDirty.current = false;
    setContactPerson({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      // Filled in from the person's profile below
      email: null,
      phone: null,
    });
    setContactEmail("");
    setContactPhone("");

    // Auto-fill the contact fields from the person's record. Skip anything
    // the user has already typed while the fetch was in flight.
    fetchApi("/players/" + person.id)
      .then((detail: { email: string | null; phone: string | null }) => {
        setContactPerson((prev) =>
          prev && prev.id === person.id
            ? { ...prev, email: detail.email, phone: detail.phone }
            : prev,
        );
        if (!emailDirty.current) {
          setContactEmail(detail.email || "");
        }
        if (!phoneDirty.current) {
          setContactPhone(detail.phone || "");
        }
      })
      .catch(() => {
        // Leave the fields blank if the profile can't be loaded
      });
  }

  function clearContact() {
    setContactPerson(null);
    setContactEmail("");
    setContactPhone("");
    emailDirty.current = false;
    phoneDirty.current = false;
  }

  async function saveContactDetails(personId: string) {
    const edits: {email?: string; phone?: string} = {};
    if (emailDirty.current) edits.email = contactEmail.trim() || null;
    if (phoneDirty.current) edits.phone = contactPhone.trim() || null;
    if (Object.keys(edits).length > 0) {
      await patchApi("/players/" + personId, edits);
    }
  }

  async function postAssociation() {

    const trimmedName = name.trim();
    if (trimmedName.length === 0){
      setMsg("Must include a name for the association");
      return;
    }

    if (contactPerson && contactEmail.trim() === "" && contactPhone === ""){
      setMsg("Contact person must have an email or phone");
      return;
    }

    const data = {name: trimmedName, contactPersonId: contactPerson.id};

    try {
      // send a POST request to the database
      const response = await postApi("/associations", data);

      if (contactPerson) {
        await saveContactDetails(contactPerson.id);
      }
      
      navigate("/manage-associations");
    }
    catch (error){
      console.error("Something went wrong trying to POST", error);
      setMsg("Failed to create association");
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

          {/* Contact person */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <span className="w-36 shrink-0 text-sm font-medium text-ink-muted sm:pt-3">
              Contact person
            </span>
            <div className="flex-grow space-y-3">
              {contactPerson ? (
                <div className="flex items-center justify-between gap-2 border border-border rounded-lg bg-canvas px-4 py-3">
                  <span className="text-sm text-ink">
                    {contactPerson.firstName} {contactPerson.lastName}
                  </span>
                  <button
                    type="button"
                    onClick={clearContact}
                    aria-label="Remove contact person"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-primary-50 hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <PersonPicker onPick={pickContact} placeholder="Search for a contact person..." />
              )}

              {contactPerson && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="association-contact-email" className="block text-sm font-medium text-ink-muted mb-1">
                      Contact email
                    </label>
                    <input
                      id="association-contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => { setContactEmail(e.target.value); emailDirty.current = true; setMsg(""); }}
                      className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="association-contact-phone" className="block text-sm font-medium text-ink-muted mb-1">
                      Contact phone
                    </label>
                    <input
                      id="association-contact-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => { setContactPhone(e.target.value); phoneDirty.current = true; setMsg(""); }}
                      className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {msg && (
          <p className={`text-sm mt-4 font-medium text-left ${msg === "Saved!" ? "text-success" : "text-danger"}`}>
            {msg}
          </p>
        )}

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

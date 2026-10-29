import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import fetchApi, { postApi, patchApi } from '../../../lib/api';
import { ROLE_OPTIONS, roleLabel } from '../../../lib/formatName';
import PersonPicker, { type PickedPerson } from '../../../components/manage/PersonPicker';

interface ContactPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface ClubDetail {
  name: string;
  address: string | null;
  contactPerson: ContactPerson | null;
  officials: { personId: string; firstName: string; lastName: string; role: string }[];
}

interface Official {
  personId: string;
  firstName: string;
  lastName: string;
  role: string;
}

function EditClubPage(){

  const navigate = useNavigate();

  const {id} = useParams();
  const creatingNew = id === "new-club";

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [contactPerson, setContactPerson] = useState<ContactPerson | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  // Only fields the user actually typed into get sent to PATCH /players/:id,
  // so picking a new contact never clobbers the email/phone already on file.
  // Refs rather than state so the pick auto-fill (below) reads the flag as it
  // is *now*, not as it was when the pick started.
  const emailDirty = useRef(false);
  const phoneDirty = useRef(false);

  const [officials, setOfficials] = useState<Official[]>([]);
  const [newOfficial, setNewOfficial] = useState<PickedPerson | null>(null);
  const [newOfficialRole, setNewOfficialRole] = useState("CLUB_ADMIN");

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function getClub(){
      const response: ClubDetail = await fetchApi("/clubs/" + id);
      setName(response.name);
      setAddress(response.address || "");
      setContactPerson(response.contactPerson);
      setContactEmail(response.contactPerson?.email || "");
      setContactPhone(response.contactPerson?.phone || "");
      setOfficials(response.officials);
    }
    if (!creatingNew){
      getClub();
    }
  }, []);

  async function pickContact(person: PickedPerson) {
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
    try {
      const detail: { email: string | null; phone: string | null } = await fetchApi("/players/" + person.id);
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
    } catch {
      // Leave the fields blank if the profile can't be loaded
    }
  }

  function clearContact() {
    setContactPerson(null);
    setContactEmail("");
    setContactPhone("");
    emailDirty.current = false;
    phoneDirty.current = false;
  }

  function addOfficial() {
    if (!newOfficial) {
      setErrorMessage("Search for a person to add as an official");
      return;
    }
    setErrorMessage("");
    setOfficials((prev) => {
      // Adding someone who is already an official just updates their role
      const existing = prev.find((o) => o.personId === newOfficial.id);
      if (existing) {
        return prev.map((o) =>
          o.personId === newOfficial.id ? { ...o, role: newOfficialRole } : o,
        );
      }
      return [
        ...prev,
        { personId: newOfficial.id, firstName: newOfficial.firstName, lastName: newOfficial.lastName, role: newOfficialRole },
      ];
    });
    setNewOfficial(null);
  }

  function removeOfficial(personId: string) {
    setOfficials((prev) => prev.filter((o) => o.personId !== personId));
  }

  async function saveContactDetails(personId: string) {
    const edits: {email?: string; phone?: string} = {};
    if (emailDirty.current) edits.email = contactEmail.trim() || null;
    if (phoneDirty.current) edits.phone = contactPhone.trim() || null;
    if (Object.keys(edits).length > 0) {
      await patchApi("/players/" + personId, edits);
    }
  }

  async function submit(){
    setErrorMessage("");

    if (!name || name.trim() === ""){
      setErrorMessage("Name can't be empty");
      return;
    }

    const body = {
      name: name.trim(),
      address: address.trim(),
      contactPersonId: contactPerson?.id ?? null,
      // The API replaces all club roles on every update, so always send the
      // full list — omitting it would wipe the existing officials.
      roles: officials.map((o) => ({personId: o.personId, role: o.role})),
    };

    try {
      if (creatingNew){
        await postApi("/clubs", body);
        if (contactPerson) {
          await saveContactDetails(contactPerson.id);
        }
        navigate("/manage-clubs");
        return;
      }

      await patchApi("/clubs/" + id, body);
      if (contactPerson) {
        await saveContactDetails(contactPerson.id);
      }
      navigate("/manage-clubs");
    } catch {
      setErrorMessage("Failed to save. Please check the details and try again.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

      {/* 1. Heading OUTSIDE the bubble */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">
          {creatingNew ? "New Club" : "Edit Club"}
        </h1>
      </div>

      {/* 2. Wider Form Card Bubble (Fields & Button only) */}
      <div className="bg-surface border border-border rounded-lg p-8 shadow-sm">

        <div className="space-y-5">

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
            <label htmlFor="club-name" className="text-sm font-medium text-ink-muted sm:col-span-1 sm:text-right">
              Name
            </label>
            <div className="sm:col-span-3">
              <input
                id="club-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter club name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
            <label htmlFor="club-address" className="text-sm font-medium text-ink-muted sm:col-span-1 sm:text-right">
              Address
            </label>
            <div className="sm:col-span-3">
              <input
                id="club-address"
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter address"
              />
            </div>
          </div>

          {/* Contact person */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-start pt-2">
            <span className="text-sm font-medium text-ink-muted sm:col-span-1 sm:text-right sm:pt-3">
              Contact person
            </span>
            <div className="sm:col-span-3 space-y-3">
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
                    <label htmlFor="contact-email" className="block text-sm font-medium text-ink-muted mb-1">
                      Contact email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={e => { setContactEmail(e.target.value); emailDirty.current = true; }}
                      className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium text-ink-muted mb-1">
                      Contact phone
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={e => { setContactPhone(e.target.value); phoneDirty.current = true; }}
                      className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Officials */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-start pt-2">
            <span className="text-sm font-medium text-ink-muted sm:col-span-1 sm:text-right sm:pt-3">
              Officials
            </span>
            <div className="sm:col-span-3 space-y-3">
              {officials.length > 0 ? (
                <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                  {officials.map((o) => (
                    <li key={o.personId} className="flex items-center justify-between gap-2 bg-canvas px-4 py-2.5">
                      <span className="text-sm text-ink">
                        {o.firstName} {o.lastName}
                        <span className="text-ink-subtle"> — {roleLabel(o.role)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOfficial(o.personId)}
                        aria-label={`Remove ${o.firstName} ${o.lastName} as an official`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-primary-50 hover:text-ink"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-subtle">No officials yet.</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  {newOfficial ? (
                    <div className="flex items-center justify-between gap-2 border border-border rounded-lg bg-canvas px-4 py-3">
                      <span className="text-sm text-ink">
                        {newOfficial.firstName} {newOfficial.lastName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewOfficial(null)}
                        aria-label="Clear selected person"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-primary-50 hover:text-ink"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <PersonPicker onPick={setNewOfficial} placeholder="Search for a person to add..." />
                  )}
                </div>
                <select
                  aria-label="Role for new official"
                  value={newOfficialRole}
                  onChange={e => setNewOfficialRole(e.target.value)}
                  className="border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {ROLE_OPTIONS.filter((r) => r.value !== "ASSOCIATION_ADMIN").map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addOfficial}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-canvas"
                >
                  Add
                </button>
              </div>
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
            className="bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Submit
          </button>
        </div>

      </div>

    </div>
  );
}

export default EditClubPage;

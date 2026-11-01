import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

import fetchApi, { putApi, patchApi } from "../../../lib/api";
import { roleLabel } from "../../../lib/formatName";
import PersonPicker, { type PickedPerson } from "../../../components/manage/PersonPicker";

export interface Association {
  id: string;
  name: string;
}

interface ContactPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface AssociationDetail {
  name: string;
  contactPerson: ContactPerson | null;
  roles: { personId: string; role: string; person: { id: string; firstName: string; lastName: string } }[];
}

interface Official {
  personId: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function EditAssociation({ association }: { association: Association }) {

  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");

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
  const [savedOfficials, setSavedOfficials] = useState<Official[]>([]);
  const [newOfficial, setNewOfficial] = useState<PickedPerson | null>(null);

  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function getDetail() {
      try {
        const detail: AssociationDetail = await fetchApi("/associations/" + association.id);
        setName(detail.name);
        setSavedName(detail.name);
        setContactPerson(detail.contactPerson);
        setContactEmail(detail.contactPerson?.email || "");
        setContactPhone(detail.contactPerson?.phone || "");
        emailDirty.current = false;
        phoneDirty.current = false;
        setOfficials(detail.roles.map((r) => ({
          personId: r.person.id,
          firstName: r.person.firstName,
          lastName: r.person.lastName,
          role: r.role,
        })));
        setSavedOfficials(detail.roles.map((r) => ({
          personId: r.person.id,
          firstName: r.person.firstName,
          lastName: r.person.lastName,
          role: r.role,
        })));
      } catch {
        setMsg("Failed to load association details");
      }
    }
    getDetail();
  }, [association.id]);

  // Association-level officials are association admins; club-scoped roles
  // don't belong here.
  function addOfficial() {
    if (!newOfficial) {
      setMsg("Search for a person to add as an official");
      return;
    }
    setMsg("");
    setOfficials((prev) => {
      const existing = prev.find((o) => o.personId === newOfficial.id);
      if (existing) {
        return prev;
      }
      return [
        ...prev,
        { personId: newOfficial.id, firstName: newOfficial.firstName, lastName: newOfficial.lastName, role: "ASSOCIATION_ADMIN" },
      ];
    });
    setNewOfficial(null);
  }

  function removeOfficial(personId: string) {
    setOfficials((prev) => prev.filter((o) => o.personId !== personId));
  }

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

  const isChanged =
    name.trim() !== (savedName || "").trim() ||
    contactEmail.trim() !== (contactPerson?.email || "") ||
    contactPhone.trim() !== (contactPerson?.phone || "") ||
    emailDirty.current ||
    phoneDirty.current ||
    JSON.stringify(officials) !== JSON.stringify(savedOfficials);

  async function updateAssociation() {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setMsg("Name cannot be blank")
      return;
    }

    // The API replaces all association roles on every update, so always send
    // the full list — omitting it would wipe the existing officials.
    const data = {
      name: trimmedName,
      contactPersonId: contactPerson?.id ?? null,
      roles: officials.map((o) => ({personId: o.personId, role: o.role})),
    };

    try {
      await putApi("/associations/" + association.id, data);
      if (contactPerson) {
        await saveContactDetails(contactPerson.id);
      }
      setSavedName(trimmedName);
      setSavedOfficials(officials);
      emailDirty.current = false;
      phoneDirty.current = false;
      setMsg("Saved!");
    } catch (error) {
      console.error("Something went wrong.", error);
      setMsg("Failed to save");
    }
  }

  function cancelChanges() {
    setName(savedName || "");
    setOfficials(savedOfficials);
    setContactEmail(contactPerson?.email || "");
    setContactPhone(contactPerson?.phone || "");
    emailDirty.current = false;
    phoneDirty.current = false;
    setNewOfficial(null);
    setMsg("");
  }

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-8 shadow-sm">
      <h2 className="text-xl font-bold text-ink mb-6">Edit Association</h2>

      <div className="space-y-5">

        <div className="flex items-center whitespace-nowrap gap-4">
          <label htmlFor="association-name" className="w-36 shrink-0 text-sm font-medium text-ink-muted">
            Association Name
          </label>
          <input
            id="association-name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setMsg(""); }}
            className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter association name"
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

        {/* Officials */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          <span className="w-36 shrink-0 text-sm font-medium text-ink-muted sm:pt-3">
            Officials
          </span>
          <div className="flex-grow space-y-3">
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
              <button
                type="button"
                onClick={addOfficial}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-canvas"
              >
                Add as official
              </button>
            </div>
          </div>
        </div>

      </div>

      {msg && (
        <p className={`text-sm mt-4 font-medium text-left ${msg === "Saved!" ? "text-success" : "text-danger"}`}>
          {msg}
        </p>
      )}

      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={updateAssociation}
          disabled={!isChanged}
          className="bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          Save
        </button>

        <button
          onClick={cancelChanges}
          className="border border-border-strong bg-muted text-ink font-medium px-4 py-3 rounded-lg hover:bg-border"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

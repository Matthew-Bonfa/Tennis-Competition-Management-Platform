import { useState } from "react";

import {putApi} from "../../../lib/api"

export interface Association {
  id: string;
  name: string;
}

export function EditAssociation({association}: {association: Association}) {

  const [name, setName] = useState(association.name || "");
  const [msg, setMsg] = useState("");

  const [savedName, setSavedName] = useState(association.name);
  const isChanged = name.trim() !== (savedName || "").trim();

  async function updateAssociation() {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setMsg("Name cannot be blank")
      return;
    }

    const data = { name: trimmedName };

    try {
      await putApi("/associations/" + association.id, data);
      setSavedName(trimmedName);
      setMsg("Saved!");
    } catch (error) {
      console.error("Something went wrong.", error);
      setMsg("Failed to save");
    }
  }

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-8 shadow-sm">
      <h2 className="text-xl font-bold text-ink mb-6">Edit Association</h2>

      <div className="flex items-center whitespace-nowrap gap-4 mb-6">
        <label className="text-sm font-medium text-ink-muted">
          Association Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setMsg(""); }}
          className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Enter association name"
        />
      </div>

      {msg && (
        <p className={`text-sm mb-4 font-medium text-left ${msg === "Saved!" ? "text-success" : "text-danger"}`}>
          {msg}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button 
          onClick={updateAssociation} 
          disabled={!isChanged} 
          className="bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          Save
        </button>

        <button
          onClick={() => { setName(association.name || ""); setMsg(""); }}
          className="border border-border-strong bg-muted text-ink font-medium px-4 py-3 rounded-lg hover:bg-border"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
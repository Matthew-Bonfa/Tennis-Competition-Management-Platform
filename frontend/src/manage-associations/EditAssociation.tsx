import { useState } from "react";

import {putApi} from "../api"

export function EditAssociation({association, setAssociation}) {

  const [name, setName] = useState(association.name || "");
  const [msg, setMsg] = useState("");

  const isChanged = name.trim() !== (association.name || "").trim();

  if (!association) return;

  async function updateAssociation() {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setMsg("Name cannot be blank")
      return;
    }

    const data = { name: trimmedName };

    try {
      await putApi("/associations/" + association.id, data);
      const associationCopy = {...association};
      associationCopy.name = trimmedName;
      setAssociation(associationCopy);
      setMsg("Saved!");
    } catch (error) {
      console.error("Something went wrong.", error);
      setMsg("Failed to save");
    }
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Association</h2>

      <div className="flex items-center whitespace-nowrap gap-4 mb-6">
        <label className="block text-left text-sm font-medium text-gray-700 mb-2">
          Association Name
        </label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => { setName(e.target.value); setMsg(""); }} 
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Enter association name"
        />
      </div>

      {msg && (
        <p className={`text-sm mb-4 font-medium text-left ${msg === "Saved!" ? "text-emerald-600" : "text-rose-600"}`}>
          {msg}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button 
          onClick={updateAssociation} 
          disabled={!isChanged} 
          className="px-5 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-sky-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>

        <button 
          onClick={() => { setName(association.name || ""); setMsg(""); }}
          className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import AssociationsList from './AssociationsList'

function AssociationsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-ink tracking-tight">Associations</h1>
      <AssociationsList />
    </div>
  );
}

export default AssociationsPage;
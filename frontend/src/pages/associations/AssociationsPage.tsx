// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import AssociationsList from './AssociationsList'

function AssociationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold text-ink">Associations</h1>
      <AssociationsList />
    </div>
  );
}

export default AssociationsPage;
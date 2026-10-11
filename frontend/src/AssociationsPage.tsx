// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import {Link} from 'react-router-dom';

import AssociationsList from './AssociationsList'

function AssociationsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Associations</h1>
      <AssociationsList />
    </div>
  );
}

export default AssociationsPage;
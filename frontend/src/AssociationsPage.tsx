// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import {Link} from 'react-router-dom';

import {ASSOCIATIONS} from './mock-data/MockAssociations'

function AssociationsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Tennis Associations</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {ASSOCIATIONS.map((assoc) => (
          <Link 
            key={assoc.id} 
            to={`/associations/${assoc.id}`}
            className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-emerald-800 mb-2">{assoc.name}</h2>
            <p className="text-gray-600 text-sm">{assoc.description}</p>
            <div className="mt-4 text-emerald-600 text-sm font-medium flex items-center">
              View Association Profile &rarr;
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AssociationsPage;
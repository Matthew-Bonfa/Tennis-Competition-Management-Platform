// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import {Link} from 'react-router-dom';

import {ASSOCIATIONS} from './mock-data/MockAssociations'
import AssociationsList from './AssociationsList'

function AssociationsPage() {
  return (
    <div>
      <h1>Associations</h1>
      <AssociationsList />
    </div>
  );
}

export default AssociationsPage;
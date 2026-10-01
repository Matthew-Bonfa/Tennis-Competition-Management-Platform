import {Link} from 'react-router-dom';

function ManageAssociationsPage() {


  return (
    <div>
      <h1>Manage Associations</h1>
      <Link className="border border-black" to="/manage-associations/create-new-association">
        + New Association
      </Link>
    </div>
  )
}

export default ManageAssociationsPage;

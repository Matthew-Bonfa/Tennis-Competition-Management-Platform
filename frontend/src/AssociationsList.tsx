import {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'

import fetchApi from './api'

function AssociationsList(){

    const [associations, setAssociations] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {

        async function fetchAssociations(){
            let data = await fetchApi("/associations");

            console.log(data);

            setAssociations(data);
            setLoading(false);
            
        }

        fetchAssociations();
    }, []);

    // if loading then return some placeholder component
    // otherwise return the actual component you want

    if (loading){
        return <p>Loading...</p>;
    } else {
        return <div className="grid gap-6 md:grid-cols-3">
                {associations.map((assoc) => (
                <Link 
                    key={assoc.id}
                    to={`/associations/` + assoc.id}
                    className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <h2 className="text-xl font-semibold text-emerald-800 mb-2">{assoc.name}</h2>
                    <div className="mt-4 text-emerald-600 text-sm font-medium flex items-center">
                        View Association Profile &rarr;
                    </div>
                </Link>
                ))}
            </div>;
    }



}


export default AssociationsList;
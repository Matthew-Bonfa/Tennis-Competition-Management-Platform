import {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import { Building2, ChevronRight } from 'lucide-react'

import fetchApi from '../../lib/api'
import LoadingState from '../../components/ui/LoadingState';

interface AssociationSummary {
    id: string;
    name: string;
}

function AssociationsList(){

    const [associations, setAssociations] = useState<AssociationSummary[]>([]);
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
        return <LoadingState />;
    } else {
        return (
            <div className="space-y-3">
            {associations.map((assoc) => (
                <Link 
                key={assoc.id}
                to={`/associations/${assoc.id}`}
                className="group flex items-center justify-between p-4 bg-surface border border-border/80 rounded-xl shadow-xs hover:border-primary-300 hover:shadow-md transition-all duration-200"
                >
                {/* Left side: Icon + Association Name & Contact */}
                <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2.5 bg-primary-50 text-primary-600 rounded-lg">
                        <Building2 className="h-5 w-5" />
                    </div>
                    
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-ink group-hover:text-primary-600 transition-colors truncate">
                            {assoc.name}
                        </h2>
                    </div>
                </div>

                {/* Right side: Action link with sliding arrow */}
                <div className="flex items-center gap-2 text-xs font-medium text-primary-600 shrink-0 ml-4">
                    <span className="hidden sm:inline">View Profile</span>
                    <ChevronRight className="h-4 w-4 text-ink-subtle group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                </div>
                </Link>
            ))}
            </div>
        );
    }



}


export default AssociationsList;
// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import {useState, useEffect} from 'react'
import { Link } from 'react-router-dom';
import { Trophy, Shield, User, Phone, Mail, ChevronRight, ArrowLeft } from 'lucide-react';

import fetchApi from '../../lib/api.js'

interface ContactPerson {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

interface AssociationDetail {
  id: string;
  name: string;
  contactPerson?: ContactPerson;
}

interface ClubSummary {
  id: string;
  name: string;
}

interface CompetitionSummary {
  id: string;
  name: string;
}

function AssociationProfile() {

  const id = window.location.pathname.split("/").at(-1);

  const [association, setAssociation] = useState<AssociationDetail>();
  const [clubs, setClubs] = useState<ClubSummary[]>();
  const [competitions, setCompetitions] = useState<CompetitionSummary[]>();

  useEffect(() => {
    async function fetchAssociation(){
        let data = await fetchApi("/associations/" + id);
        setAssociation(data);        
    }
    fetchAssociation();
  }, []);



  useEffect(() => {
    if (!association){
      return;
    }
    const associationId = association.id;
    async function fetchClubs(){
      let data = await fetchApi("/clubs?associationId=" + associationId);
      setClubs(data);
    }
    fetchClubs();
  }, [association]);



  useEffect(() => {
    if (!association){
      return;
    }
    const associationId = association.id;
    async function fetchCompetitions(){
      let data = await fetchApi("/competitions?associationId=" + associationId);
      console.log(data);
      setCompetitions(data);
    }
    fetchCompetitions();
  }, [association]);
  
  

  if (!association) {
    return <div className="p-8 text-center text-gray-600">Association not found.</div>;
  }


  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
    {/* Back Link */}
    <Link 
      to="/associations" 
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-sky-600 mb-2 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Associations
    </Link>

    {/* Association Info Card */}
    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Side: Association Title */}
        <div className="space-y-1 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {association.name}
          </h1>
        </div>

        {/* Right Side: Contact Info Card */}
        <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-4 min-w-[280px]">
          {association.contactPerson ? (
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex items-center gap-2 font-medium text-gray-900 pb-1 border-b border-gray-200/50">
                <User className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{association.contactPerson.firstName} {association.contactPerson.lastName}</span>
              </div>

              {association.contactPerson.phone && (
                <div className="flex items-center gap-2 text-xs pt-1">
                  <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <a href={`tel:${association.contactPerson.phone}`} className="text-sky-600 hover:underline">
                    {association.contactPerson.phone}
                  </a>
                </div>
              )}

              {association.contactPerson.email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <a href={`mailto:${association.contactPerson.email}`} className="text-sky-600 hover:underline truncate">
                    {association.contactPerson.email}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400 italic">
              <User className="h-4 w-4 text-gray-300 shrink-0" />
              <span>No contact person assigned</span>
            </div>
          )}
        </div>

      </div>
    </div>

    {/* Clubs & Competitions Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Clubs Box */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Clubs</h2>
          <span className="ml-auto bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {clubs?.length || 0}
          </span>
        </div>

        <div className="space-y-3 flex-1">
          {clubs && clubs.length > 0 ? (
            clubs.map((club) => (
              <Link 
                key={club.id}
                to={`/clubs/${club.id}`}
                className="group flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-white border border-gray-200/60 hover:border-sky-300 rounded-xl shadow-xs hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800 group-hover:text-gray-900 text-sm">
                    {club.name}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
              <p className="text-sm text-gray-400 italic">No clubs registered yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Competitions Box */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
            <Trophy className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Competitions</h2>
          <span className="ml-auto bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {competitions?.length || 0}
          </span>
        </div>

        <div className="space-y-3 flex-1">
          {competitions && competitions.length > 0 ? (
            competitions.map((comp) => (
              <Link
                key={comp.id}
                to={`/competitions/${comp.id}`}
                className="group flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-white border border-gray-200/60 hover:border-sky-300 rounded-xl shadow-xs hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800 group-hover:text-gray-900 text-sm">
                    {comp.name}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
              <p className="text-sm text-gray-400 italic">No competitions active</p>
            </div>
          )}
        </div>
      </div>

    </div>
  </div>
  );
}

export default AssociationProfile;
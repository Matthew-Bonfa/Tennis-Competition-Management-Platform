// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import {useState, useEffect} from 'react'
import { useParams, Link } from 'react-router-dom';
import { Trophy, Building2, Shield, User, Phone, Mail, ChevronRight, Award, ArrowLeft } from 'lucide-react';

import fetchApi from './api.js'

import { ASSOCIATIONS } from './mock-data/MockAssociations';

function AssociationProfile() {

  const id = window.location.pathname.split("/").at(-1);
  
  const [association, setAssociation] = useState();
  const [clubs, setClubs] = useState();
  const [competitions, setCompetitions] = useState();

  const [roles, setRoles] = useState();

  useEffect(() => {
    async function fetchAssociation(){
        let data = await fetchApi("/associations/" + id);
        setAssociation(data);

        let fullRoles = [];
        if (data.roles){
          for (let i = 0; i < data.roles.length; i++){
            let person = await fetchApi('/players/' + data.roles[i].personId);
            fullRoles.push({
              firstName: person.firstName,
              lastName: person.lastName,
              role: data.roles[i].role
            })
          }
          setRoles(fullRoles);
        }
    }
    fetchAssociation();
  }, []);



  useEffect(() => {
    if (!association){
      return;
    }
    async function fetchClubs(){
      let data = await fetchApi("/clubs?associationId=" + association.id);
      setClubs(data);
    }
    fetchClubs();
  }, [association]);



  useEffect(() => {
    if (!association){
      return;
    }
    async function fetchCompetitions(){
      let data = await fetchApi("/competitions?associationId=" + association.id);
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
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Centered Association Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {association.name}
          </h1>
        </div>

        {/* Contact & Roles Box directly below the title */}
        <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-5 space-y-6">
          
          {/* Centered Primary Contact Section */}
          <div className="flex flex-col items-center text-center">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Primary Contact</h3>
            {association.contactPerson ? (
              <div className="space-y-1.5 text-sm text-gray-700 w-full max-w-sm">
                <div className="flex items-center justify-center gap-2 font-medium text-gray-900 pb-1 border-b border-gray-200/50">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{association.contactPerson.firstName} {association.contactPerson.lastName}</span>
                </div>

                {association.contactPerson.phone && (
                  <div className="flex items-center justify-center gap-2 text-xs pt-1">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <a href={`tel:${association.contactPerson.phone}`} className="text-sky-600 hover:underline">
                      {association.contactPerson.phone}
                    </a>
                  </div>
                )}

                {association.contactPerson.email && (
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <a href={`mailto:${association.contactPerson.email}`} className="text-sky-600 hover:underline truncate">
                      {association.contactPerson.email}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 italic">
                <User className="h-4 w-4 text-gray-300 shrink-0" />
                <span>No contact person assigned</span>
              </div>
            )}
          </div>

          {/* Key Roles Section - Only renders if roles exist */}
          {roles && roles.length > 0 && (
            <div className="pt-4 border-t border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center sm:text-left">
                Key Roles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {roles.map((r, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200/90 rounded-xl text-sm shadow-2xs hover:border-sky-200 transition-colors"
                  >
                    <span className="font-semibold text-sky-600 shrink-0">
                      {r.role}:
                    </span>
                    <span className="text-gray-800 font-medium truncate">
                      {r.firstName} {r.lastName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
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
    return <div className="p-8 text-center text-ink-muted">Association not found.</div>;
  }


  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
    {/* Back Link */}
    <Link 
      to="/associations" 
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-subtle hover:text-primary-600 mb-2 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Associations
    </Link>

    {/* Association Info Card */}
    <div className="bg-surface border border-border/80 rounded-lg p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Side: Association Title */}
        <div className="space-y-1 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {association.name}
          </h1>
        </div>

        {/* Right Side: Contact Info Card */}
        <div className="bg-canvas/80 border border-border/60 rounded-lg p-4 min-w-0 md:min-w-[280px]">
          {association.contactPerson ? (
            <div className="space-y-1.5 text-sm text-ink-muted">
              <div className="flex items-center gap-2 font-medium text-ink pb-1 border-b border-border/50">
                <User className="h-4 w-4 text-ink-subtle shrink-0" />
                <span>{association.contactPerson.firstName} {association.contactPerson.lastName}</span>
              </div>

              {association.contactPerson.phone && (
                <div className="flex items-center gap-2 text-xs pt-1">
                  <Phone className="h-3.5 w-3.5 text-ink-subtle shrink-0" />
                  <a href={`tel:${association.contactPerson.phone}`} className="text-primary-600 hover:underline">
                    {association.contactPerson.phone}
                  </a>
                </div>
              )}

              {association.contactPerson.email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3.5 w-3.5 text-ink-subtle shrink-0" />
                  <a href={`mailto:${association.contactPerson.email}`} className="text-primary-600 hover:underline truncate">
                    {association.contactPerson.email}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-ink-subtle italic">
              <User className="h-4 w-4 text-ink-subtle shrink-0" />
              <span>No contact person assigned</span>
            </div>
          )}
        </div>

      </div>
    </div>

    {/* Clubs & Competitions Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Clubs Box */}
      <div className="bg-surface border border-border/80 rounded-lg p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border">
          <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-ink">Clubs</h2>
          <span className="ml-auto bg-muted text-ink-muted text-xs font-semibold px-2.5 py-1 rounded-full">
            {clubs?.length || 0}
          </span>
        </div>

        <div className="space-y-3 flex-1">
          {clubs && clubs.length > 0 ? (
            clubs.map((club) => (
              <Link 
                key={club.id}
                to={`/clubs/${club.id}`}
                className="group flex items-center justify-between p-3.5 bg-canvas/70 hover:bg-surface border border-border/60 hover:border-primary-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink group-hover:text-ink text-sm">
                    {club.name}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-subtle group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-ink-subtle italic">No clubs registered yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Competitions Box */}
      <div className="bg-surface border border-border/80 rounded-lg p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border">
          <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
            <Trophy className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-ink">Competitions</h2>
          <span className="ml-auto bg-muted text-ink-muted text-xs font-semibold px-2.5 py-1 rounded-full">
            {competitions?.length || 0}
          </span>
        </div>

        <div className="space-y-3 flex-1">
          {competitions && competitions.length > 0 ? (
            competitions.map((comp) => (
              <Link
                key={comp.id}
                to={`/competitions/${comp.id}`}
                className="group flex items-center justify-between p-3.5 bg-canvas/70 hover:bg-surface border border-border/60 hover:border-primary-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink group-hover:text-ink text-sm">
                    {comp.name}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-subtle group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-ink-subtle italic">No competitions active</p>
            </div>
          )}
        </div>
      </div>

    </div>
  </div>
  );
}

export default AssociationProfile;
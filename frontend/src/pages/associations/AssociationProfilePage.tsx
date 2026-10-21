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
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <p className="text-ink-muted mb-4">Association not found.</p>
        <Link to="/associations" className="text-primary-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Associations
        </Link>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
    {/* Back Link */}
    <Link 
      to="/associations" 
      className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary-600 mb-2 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Associations
    </Link>

    {/* Association Info Card */}
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Side: Association Title */}
        <div className="space-y-1 max-w-md">
          <h1 className="text-3xl font-bold text-ink">
            {association.name}
          </h1>
        </div>

        {/* Right Side: Contact Info Card */}
        <div className="bg-canvas border border-border rounded-lg p-4 min-w-0 md:min-w-[280px]">
          {association.contactPerson ? (
            <div className="space-y-1.5 text-sm text-ink-muted">
              <div className="flex items-center gap-2 font-medium text-ink pb-1 border-b border-border">
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
      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border">
          <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-ink">Clubs</h2>
          <span className="ml-auto bg-muted text-ink-muted text-xs font-semibold px-2.5 py-1 rounded-md">
            {clubs?.length || 0}
          </span>
        </div>

        <div className="space-y-3 flex-1">
          {clubs && clubs.length > 0 ? (
            clubs.map((club) => (
              <Link 
                key={club.id}
                to={`/clubs/${club.id}`}
                className="group flex items-center justify-between p-3.5 bg-canvas hover:bg-surface border border-border rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink text-sm">
                    {club.name}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-subtle group-hover:text-primary-600 transition-colors" />
              </Link>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg">
              <p className="text-sm text-ink-subtle italic">No clubs registered yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Competitions Box */}
      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border">
          <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
            <Trophy className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-ink">Competitions</h2>
          <span className="ml-auto bg-muted text-ink-muted text-xs font-semibold px-2.5 py-1 rounded-md">
            {competitions?.length || 0}
          </span>
        </div>

        <div className="space-y-3 flex-1">
          {competitions && competitions.length > 0 ? (
            competitions.map((comp) => (
              <Link
                key={comp.id}
                to={`/competitions/${comp.id}`}
                className="group flex items-center justify-between p-3.5 bg-canvas hover:bg-surface border border-border rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink text-sm">
                    {comp.name}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-subtle group-hover:text-primary-600 transition-colors" />
              </Link>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg">
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
// file created by Rex Kelly
// AI created this data

import {ASSOCIATIONS} from './MockAssociations'

export const ALL_CLUBS = [
  ...ASSOCIATIONS.flatMap(a => a.clubs),
  { id: 'club-10', name: 'Fairfield Community TC', courts: 4, location: 'Fairfield' },
  { id: 'club-11', name: 'Alphington Aces', courts: 6, location: 'Alphington' }
];
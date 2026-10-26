// file created by Rex Kelly
// AI made this data

import {ASSOCIATIONS} from './MockAssociations'

export const ALL_COMPETITIONS = ASSOCIATIONS.flatMap(a =>
  a.competitions.map(c => ({
    ...c,
    associationId: a.id,
    associationName: a.name
  }))
);

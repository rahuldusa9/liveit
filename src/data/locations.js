/**
 * Location definitions for Neo Meridian City
 * 5 main districts + a neutral city center
 */

import { FACTION_IDS } from './factions.js';

export const locations = {
  'financial-district': {
    id: 'financial-district',
    name: 'Financial District',
    shortName: 'Finance',
    description: 'Glass and steel towers reaching for the clouds. The air smells like money and ambition. Every second here costs somebody something.',
    faction: FACTION_IDS.TITAN,
    icon: '🏙️',
    npcs: ['victoria-steele', 'marcus-webb', 'diana-cross', 'jake-torres'],
    landmarks: ['Titan Tower', 'Neo Meridian Stock Exchange', 'The Platinum Lounge'],
    atmosphere: 'Pristine, intimidating, surveilled. Security everywhere. Power suits and cold stares.',
    mapPosition: { x: 65, y: 25 }
  },

  'government-quarter': {
    id: 'government-quarter',
    name: 'Government Quarter',
    shortName: 'Gov Quarter',
    description: 'Marble columns and manicured lawns hide the rot within. City Hall stands like a temple to democracy — or its grave.',
    faction: FACTION_IDS.CITYHALL,
    icon: '🏛️',
    npcs: ['james-calloway', 'ava-mitchell', 'roy-harding', 'clara-finch'],
    landmarks: ['City Hall', 'Supreme Court', 'Police HQ', 'Senate Building'],
    atmosphere: 'Formal, tense, whispered conversations. Everyone watches everyone. Protocol masks chaos.',
    mapPosition: { x: 25, y: 25 }
  },

  'the-docks': {
    id: 'the-docks',
    name: 'The Docks',
    shortName: 'Docks',
    description: 'Salt air, rusted containers, and the constant rumble of ships. By day it\'s a shipping yard. By night, it belongs to the Syndicate.',
    faction: FACTION_IDS.SYNDICATE,
    icon: '⚓',
    npcs: ['ghost-moreno', 'natasha-volkov', 'dante-reyes', 'whisper-li'],
    landmarks: ['Warehouse 13', 'The Black Pearl Bar', 'Container Maze', 'Ghost\'s Office'],
    atmosphere: 'Dangerous, poorly lit, smells of diesel and fear. Every shadow could be watching.',
    mapPosition: { x: 70, y: 72 }
  },

  'outer-districts': {
    id: 'outer-districts',
    name: 'Outer Districts',
    shortName: 'Outer',
    description: 'Where the city forgets to look. Crumbling apartments, community gardens growing through concrete. The people here have nothing left to lose.',
    faction: FACTION_IDS.VANGUARD,
    icon: '🏚️',
    npcs: ['priya-lakshmi', 'omar-hassan', 'zoe-park', 'father-miguel'],
    landmarks: ['Community Center', 'The People\'s Market', 'St. Michael\'s Church', 'Zoe\'s Workshop'],
    atmosphere: 'Vibrant despite poverty. Street art everywhere. Music from open windows. Solidarity in struggle.',
    mapPosition: { x: 22, y: 72 }
  },

  'media-tower': {
    id: 'media-tower',
    name: 'Media Tower District',
    shortName: 'Media',
    description: 'The Lens Network\'s broadcast tower dominates the skyline. Screens everywhere blare the news — or whatever Chen Wei decides is news today.',
    faction: FACTION_IDS.LENS,
    icon: '📡',
    npcs: ['chen-wei', 'sarah-blake', 'tommy-nguyen', 'rina-desai'],
    landmarks: ['The Lens Tower', 'Broadcast Studio', 'Data Archives', 'Rooftop Bar'],
    atmosphere: 'Buzzing, electric, always-on. Screens and cameras everywhere. Truth and lies blur together.',
    mapPosition: { x: 48, y: 12 }
  },

  'city-center': {
    id: 'city-center',
    name: 'City Center',
    shortName: 'Center',
    description: 'The neutral ground where all factions overlap. Cafes, parks, and public squares where deals are made over coffee and whispers.',
    faction: null,
    icon: '🌆',
    npcs: [],
    landmarks: ['Meridian Plaza', 'Central Park', 'The Crossroads Cafe', 'Underground Mall'],
    atmosphere: 'Busy, cosmopolitan, deceptively peaceful. The calm eye of the storm.',
    mapPosition: { x: 45, y: 48 }
  }
};

export function getLocation(id) {
  return locations[id];
}

export function getAllLocations() {
  return Object.values(locations);
}

export function getLocationByFaction(factionId) {
  return Object.values(locations).find(l => l.faction === factionId);
}

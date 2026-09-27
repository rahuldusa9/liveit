/**
 * Faction definitions for Neo Meridian City
 * Each faction controls a district and has relationships with others.
 */

export const FACTION_IDS = {
  TITAN: 'titan-corp',
  CITYHALL: 'city-hall',
  SYNDICATE: 'the-syndicate',
  VANGUARD: 'vanguard-movement',
  LENS: 'lens-network'
};

export const RANKS = ['Outsider', 'Associate', 'Trusted', 'Inner Circle', 'Second-in-Command', 'Leader'];

export const factions = {
  [FACTION_IDS.TITAN]: {
    id: FACTION_IDS.TITAN,
    name: 'Titan Corp',
    shortName: 'Titan',
    description: 'The financial juggernaut that owns half the city. Their towers pierce the sky like silver fangs. If you can\'t buy it, it doesn\'t exist.',
    philosophy: 'Power through wealth. Buy anything, anyone.',
    color: '#F59E0B',
    colorRgb: '245, 158, 11',
    colorDark: '#B45309',
    icon: '🏛️',
    territory: 'financial-district',
    leaderId: 'victoria-steele',
    initialPower: 85,
    initialRelations: {
      [FACTION_IDS.CITYHALL]: 30,   // Cozy, buy politicians
      [FACTION_IDS.SYNDICATE]: -20, // Business rivalry
      [FACTION_IDS.VANGUARD]: -60,  // Hate revolutionaries
      [FACTION_IDS.LENS]: 10        // Media deals
    },
    strengths: ['Unlimited funding', 'Corporate espionage', 'Legal team', 'Lobbyists'],
    weaknesses: ['Public image sensitive', 'Internal power struggles', 'Arrogant overconfidence']
  },

  [FACTION_IDS.CITYHALL]: {
    id: FACTION_IDS.CITYHALL,
    name: 'City Hall',
    shortName: 'Gov',
    description: 'The official government of Neo Meridian. Laws, police, courts — they control the system. But the system is rotting from within.',
    philosophy: 'Control through law. Bureaucracy is power.',
    color: '#3B82F6',
    colorRgb: '59, 130, 246',
    colorDark: '#1D4ED8',
    icon: '⚖️',
    territory: 'government-quarter',
    leaderId: 'james-calloway',
    initialPower: 75,
    initialRelations: {
      [FACTION_IDS.TITAN]: 30,       // Takes their money
      [FACTION_IDS.SYNDICATE]: -40,  // Officially enemies
      [FACTION_IDS.VANGUARD]: -30,   // Fears uprising
      [FACTION_IDS.LENS]: -10        // Hates scrutiny
    },
    strengths: ['Police force', 'Legal authority', 'Surveillance', 'Public funding'],
    weaknesses: ['Corruption scandals', 'Bureaucratic slowness', 'Public distrust']
  },

  [FACTION_IDS.SYNDICATE]: {
    id: FACTION_IDS.SYNDICATE,
    name: 'The Syndicate',
    shortName: 'Syndicate',
    description: 'They own the shadows. The docks, the underground, the black market — nothing moves at night without their permission.',
    philosophy: 'Power through fear. Own the shadows.',
    color: '#8B5CF6',
    colorRgb: '139, 92, 246',
    colorDark: '#6D28D9',
    icon: '🕶️',
    territory: 'the-docks',
    leaderId: 'ghost-moreno',
    initialPower: 70,
    initialRelations: {
      [FACTION_IDS.TITAN]: -20,      // Underground rivalry
      [FACTION_IDS.CITYHALL]: -40,   // Law vs crime
      [FACTION_IDS.VANGUARD]: 10,    // Mutual enemy (Gov)
      [FACTION_IDS.LENS]: -50        // Hates exposure
    },
    strengths: ['Fear and intimidation', 'Black market', 'Smuggling network', 'Street intelligence'],
    weaknesses: ['No legal protection', 'Internal betrayals', 'Media exposure']
  },

  [FACTION_IDS.VANGUARD]: {
    id: FACTION_IDS.VANGUARD,
    name: 'Vanguard Movement',
    shortName: 'Vanguard',
    description: 'Born from the disenfranchised outer districts. They fight for the people, but their methods grow more radical by the day.',
    philosophy: 'Power through the people. Revolution rises.',
    color: '#10B981',
    colorRgb: '16, 185, 129',
    colorDark: '#047857',
    icon: '✊',
    territory: 'outer-districts',
    leaderId: 'priya-lakshmi',
    initialPower: 55,
    initialRelations: {
      [FACTION_IDS.TITAN]: -60,      // Fight the rich
      [FACTION_IDS.CITYHALL]: -30,   // Distrust government
      [FACTION_IDS.SYNDICATE]: 10,   // Share enemies
      [FACTION_IDS.LENS]: 20         // Need media coverage
    },
    strengths: ['Popular support', 'Grassroots network', 'Moral high ground', 'Hackers'],
    weaknesses: ['Low funding', 'Ideological splits', 'No military power']
  },

  [FACTION_IDS.LENS]: {
    id: FACTION_IDS.LENS,
    name: 'The Lens Network',
    shortName: 'Lens',
    description: 'They don\'t fight with guns or money — they fight with truth. Or lies. Whichever gets more clicks. Information is the ultimate weapon.',
    philosophy: 'Power through information. Truth is a weapon.',
    color: '#F43F5E',
    colorRgb: '244, 63, 94',
    colorDark: '#BE123C',
    icon: '📡',
    territory: 'media-tower',
    leaderId: 'chen-wei',
    initialPower: 60,
    initialRelations: {
      [FACTION_IDS.TITAN]: 10,       // Ad revenue
      [FACTION_IDS.CITYHALL]: -10,   // Tension
      [FACTION_IDS.SYNDICATE]: -50,  // Expose crime
      [FACTION_IDS.VANGUARD]: 20     // Cover protests
    },
    strengths: ['Public opinion control', 'Information network', 'Blackmail material', 'Global reach'],
    weaknesses: ['No physical power', 'Reputation dependent', 'Internal leaks']
  }
};

export function getFaction(id) {
  return factions[id];
}

export function getAllFactions() {
  return Object.values(factions);
}

export function getFactionColor(id) {
  return factions[id]?.color || '#666';
}

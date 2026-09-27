/**
 * Dynamic event templates for Neo Meridian City.
 * Events are triggered based on game state conditions and
 * create dramatic moments that reshape the political landscape.
 */

import { FACTION_IDS } from './factions.js';

export const eventTemplates = [
  // ═══════════════════════════════════════════
  //  CORPORATE EVENTS
  // ═══════════════════════════════════════════
  {
    id: 'titan-scandal',
    title: 'Corporate Scandal at Titan Corp',
    description: 'Internal documents leaked to The Lens reveal Titan Corp\'s involvement in illegal dumping. Victoria Steele scrambles for damage control.',
    type: 'scandal',
    affectedFaction: FACTION_IDS.TITAN,
    triggerConditions: { minDay: 3, probability: 0.12 },
    effects: {
      factionPower: { [FACTION_IDS.TITAN]: -8, [FACTION_IDS.LENS]: +5 },
      npcRelationships: {
        'victoria-steele': { suspicion: +10 },
        'sarah-blake': { respect: +5 }
      }
    },
    choices: [
      { text: 'Offer Victoria help burying the story', effect: 'titan_ally', influenceChange: { faction: FACTION_IDS.TITAN, amount: 10 } },
      { text: 'Feed more evidence to Sarah Blake', effect: 'lens_ally', influenceChange: { faction: FACTION_IDS.LENS, amount: 10 } },
      { text: 'Stay out of it and observe', effect: 'neutral', influenceChange: null }
    ]
  },

  {
    id: 'embezzlement-discovery',
    title: 'Audit Alarm at Titan Corp',
    description: 'An unexpected audit threatens to expose Marcus Webb\'s embezzlement. He\'s panicking and looking for help.',
    type: 'crisis',
    affectedFaction: FACTION_IDS.TITAN,
    triggerConditions: { minDay: 5, probability: 0.10, requiredIntel: 'marcus-embezzlement' },
    effects: {
      npcRelationships: {
        'marcus-webb': { fear: +20, trust: -10 }
      }
    },
    choices: [
      { text: 'Help Marcus cover it up (he\'ll owe you)', effect: 'blackmail_marcus', influenceChange: { faction: FACTION_IDS.TITAN, amount: 5 } },
      { text: 'Report it to Victoria for her favor', effect: 'expose_marcus', influenceChange: { faction: FACTION_IDS.TITAN, amount: 15 } },
      { text: 'Use the information as leverage later', effect: 'store_intel', influenceChange: null }
    ]
  },

  // ═══════════════════════════════════════════
  //  GOVERNMENT EVENTS
  // ═══════════════════════════════════════════
  {
    id: 'election-season',
    title: 'Election Season Begins',
    description: 'Mayor Calloway announces his re-election campaign. Every faction is maneuvering to influence the outcome.',
    type: 'political',
    affectedFaction: FACTION_IDS.CITYHALL,
    triggerConditions: { minDay: 7, probability: 0.15, oneTime: true },
    effects: {
      factionPower: { [FACTION_IDS.CITYHALL]: +5 },
      npcRelationships: {
        'james-calloway': { suspicion: -10 }
      }
    },
    choices: [
      { text: 'Offer to support Calloway\'s campaign', effect: 'support_calloway', influenceChange: { faction: FACTION_IDS.CITYHALL, amount: 15 } },
      { text: 'Back Senator Mitchell as a challenger', effect: 'support_mitchell', influenceChange: { faction: FACTION_IDS.CITYHALL, amount: -5 } },
      { text: 'Play both sides for maximum leverage', effect: 'double_agent', influenceChange: null }
    ]
  },

  {
    id: 'police-raid',
    title: 'Police Raid on the Docks',
    description: 'Chief Harding orders a major raid on Syndicate operations at the Docks. But was it a real bust or just for show?',
    type: 'conflict',
    affectedFaction: FACTION_IDS.SYNDICATE,
    triggerConditions: { minDay: 4, probability: 0.10 },
    effects: {
      factionPower: { [FACTION_IDS.SYNDICATE]: -5, [FACTION_IDS.CITYHALL]: +3 },
      npcRelationships: {
        'ghost-moreno': { fear: +5, suspicion: +15 },
        'roy-harding': { suspicion: +5 }
      }
    },
    choices: [
      { text: 'Warn Ghost Moreno about the raid', effect: 'syndicate_ally', influenceChange: { faction: FACTION_IDS.SYNDICATE, amount: 15 } },
      { text: 'Help the police gather evidence', effect: 'cityhall_ally', influenceChange: { faction: FACTION_IDS.CITYHALL, amount: 10 } },
      { text: 'Watch from a distance and take notes', effect: 'intel_gather', influenceChange: null }
    ]
  },

  // ═══════════════════════════════════════════
  //  SYNDICATE EVENTS
  // ═══════════════════════════════════════════
  {
    id: 'turf-war',
    title: 'Turf War Erupts',
    description: 'A Syndicate crew clashes with Titan Corp\'s private security near the Financial District border. Three wounded, tensions exploding.',
    type: 'conflict',
    affectedFaction: FACTION_IDS.SYNDICATE,
    triggerConditions: { minDay: 6, probability: 0.12 },
    effects: {
      factionPower: { [FACTION_IDS.SYNDICATE]: -3, [FACTION_IDS.TITAN]: -3 },
      npcRelationships: {
        'jake-torres': { fear: +5 },
        'dante-reyes': { trust: +5 }
      }
    },
    choices: [
      { text: 'Mediate between the factions', effect: 'peacemaker', influenceChange: { faction: FACTION_IDS.SYNDICATE, amount: 5 } },
      { text: 'Join the Syndicate\'s side', effect: 'syndicate_warrior', influenceChange: { faction: FACTION_IDS.SYNDICATE, amount: 12 } },
      { text: 'Report everything to the police', effect: 'snitch', influenceChange: { faction: FACTION_IDS.CITYHALL, amount: 8 } }
    ]
  },

  {
    id: 'syndicate-betrayal',
    title: 'Informant Discovered',
    description: 'Ghost Moreno suspects there\'s a rat in the Syndicate. The atmosphere at the Docks is electric with paranoia.',
    type: 'crisis',
    affectedFaction: FACTION_IDS.SYNDICATE,
    triggerConditions: { minDay: 8, probability: 0.08 },
    effects: {
      npcRelationships: {
        'ghost-moreno': { suspicion: +20 },
        'natasha-volkov': { fear: +15 }
      }
    },
    choices: [
      { text: 'Help Ghost find the informant', effect: 'syndicate_loyal', influenceChange: { faction: FACTION_IDS.SYNDICATE, amount: 15 } },
      { text: 'Warn Natasha she might be suspected', effect: 'protect_natasha', influenceChange: null },
      { text: 'Frame someone else to gain Ghost\'s trust', effect: 'frame_someone', influenceChange: { faction: FACTION_IDS.SYNDICATE, amount: 20 } }
    ]
  },

  // ═══════════════════════════════════════════
  //  VANGUARD EVENTS
  // ═══════════════════════════════════════════
  {
    id: 'mass-protest',
    title: 'Mass Protest in the Streets',
    description: 'The Vanguard organizes the largest protest Neo Meridian has seen in decades. Thousands fill the streets demanding change.',
    type: 'political',
    affectedFaction: FACTION_IDS.VANGUARD,
    triggerConditions: { minDay: 5, probability: 0.12 },
    effects: {
      factionPower: { [FACTION_IDS.VANGUARD]: +10, [FACTION_IDS.CITYHALL]: -5 },
      npcRelationships: {
        'priya-lakshmi': { respect: +10 },
        'james-calloway': { fear: +5 }
      }
    },
    choices: [
      { text: 'Join the protest and march alongside Priya', effect: 'vanguard_ally', influenceChange: { faction: FACTION_IDS.VANGUARD, amount: 15 } },
      { text: 'Cover the protest for The Lens to shape the narrative', effect: 'lens_reporter', influenceChange: { faction: FACTION_IDS.LENS, amount: 10 } },
      { text: 'Observe and identify protest leaders for City Hall', effect: 'informant', influenceChange: { faction: FACTION_IDS.CITYHALL, amount: 12 } }
    ]
  },

  {
    id: 'vanguard-split',
    title: 'Ideological Rift in the Vanguard',
    description: 'Omar Hassan openly challenges Priya\'s peaceful approach. The movement threatens to fracture between moderates and radicals.',
    type: 'crisis',
    affectedFaction: FACTION_IDS.VANGUARD,
    triggerConditions: { minDay: 10, probability: 0.10 },
    effects: {
      factionPower: { [FACTION_IDS.VANGUARD]: -8 },
      npcRelationships: {
        'priya-lakshmi': { trust: +5 },
        'omar-hassan': { respect: +5, suspicion: +10 }
      }
    },
    choices: [
      { text: 'Support Priya\'s peaceful vision', effect: 'peace_faction', influenceChange: { faction: FACTION_IDS.VANGUARD, amount: 10 } },
      { text: 'Back Omar\'s militant approach', effect: 'militant_faction', influenceChange: { faction: FACTION_IDS.VANGUARD, amount: 10 } },
      { text: 'Try to unite them both under your guidance', effect: 'unifier', influenceChange: { faction: FACTION_IDS.VANGUARD, amount: 20 } }
    ]
  },

  // ═══════════════════════════════════════════
  //  MEDIA EVENTS
  // ═══════════════════════════════════════════
  {
    id: 'leaked-footage',
    title: 'Explosive Footage Leaked',
    description: 'Anonymous footage of Chief Harding meeting with Syndicate members hits the internet. The Lens Network is racing to verify and broadcast it.',
    type: 'scandal',
    affectedFaction: FACTION_IDS.CITYHALL,
    triggerConditions: { minDay: 6, probability: 0.10 },
    effects: {
      factionPower: { [FACTION_IDS.CITYHALL]: -10, [FACTION_IDS.LENS]: +8, [FACTION_IDS.SYNDICATE]: -3 },
      npcRelationships: {
        'roy-harding': { fear: +20, suspicion: +10 },
        'sarah-blake': { respect: +10 }
      }
    },
    choices: [
      { text: 'Help Sarah Blake verify the footage', effect: 'journalism', influenceChange: { faction: FACTION_IDS.LENS, amount: 15 } },
      { text: 'Warn Harding so he can prepare a defense', effect: 'protect_harding', influenceChange: { faction: FACTION_IDS.CITYHALL, amount: 10 } },
      { text: 'Buy the original footage for your own leverage', effect: 'acquire_leverage', influenceChange: null }
    ]
  },

  {
    id: 'media-blackout',
    title: 'Media Blackout Ordered',
    description: 'City Hall pressures The Lens to kill a story. Chen Wei must choose: comply and keep government access, or publish and face consequences.',
    type: 'political',
    affectedFaction: FACTION_IDS.LENS,
    triggerConditions: { minDay: 8, probability: 0.08 },
    effects: {
      factionPower: { [FACTION_IDS.LENS]: -5 },
      npcRelationships: {
        'chen-wei': { suspicion: +10 },
        'sarah-blake': { trust: +5 }
      }
    },
    choices: [
      { text: 'Convince Chen Wei to publish anyway', effect: 'press_freedom', influenceChange: { faction: FACTION_IDS.LENS, amount: 15 } },
      { text: 'Help City Hall maintain the blackout', effect: 'censorship', influenceChange: { faction: FACTION_IDS.CITYHALL, amount: 12 } },
      { text: 'Leak the story through underground channels instead', effect: 'underground_leak', influenceChange: { faction: FACTION_IDS.VANGUARD, amount: 8 } }
    ]
  },

  // ═══════════════════════════════════════════
  //  CROSS-FACTION EVENTS
  // ═══════════════════════════════════════════
  {
    id: 'assassination-attempt',
    title: 'Assassination Attempt',
    description: 'Someone tried to kill a faction leader. The city holds its breath. Who ordered it?',
    type: 'crisis',
    affectedFaction: null,
    triggerConditions: { minDay: 12, probability: 0.06, oneTime: true },
    effects: {
      factionPower: {},
      npcRelationships: {}
    },
    choices: [
      { text: 'Investigate who ordered the hit', effect: 'detective', influenceChange: null },
      { text: 'Use the chaos to make a bold move', effect: 'opportunist', influenceChange: null },
      { text: 'Offer protection to the targeted leader', effect: 'protector', influenceChange: null }
    ]
  },

  {
    id: 'blackout-crisis',
    title: 'City-Wide Blackout',
    description: 'Neo Meridian loses power. In the darkness, alliances shift and old scores are settled. Who caused it — and who benefits?',
    type: 'crisis',
    affectedFaction: null,
    triggerConditions: { minDay: 15, probability: 0.08, oneTime: true },
    effects: {
      factionPower: { [FACTION_IDS.SYNDICATE]: +5, [FACTION_IDS.CITYHALL]: -8 },
      npcRelationships: {}
    },
    choices: [
      { text: 'Help restore order in the Outer Districts', effect: 'hero', influenceChange: { faction: FACTION_IDS.VANGUARD, amount: 15 } },
      { text: 'Use the blackout to raid a rival faction', effect: 'raider', influenceChange: null },
      { text: 'Protect your allies and consolidate power', effect: 'consolidate', influenceChange: null }
    ]
  },

  {
    id: 'secret-alliance',
    title: 'Secret Alliance Revealed',
    description: 'Evidence surfaces that two factions have been secretly cooperating. The revelation reshapes the entire political landscape.',
    type: 'scandal',
    affectedFaction: null,
    triggerConditions: { minDay: 10, probability: 0.07 },
    effects: {
      factionPower: {},
      npcRelationships: {}
    },
    choices: [
      { text: 'Expose the alliance publicly', effect: 'whistleblower', influenceChange: { faction: FACTION_IDS.LENS, amount: 10 } },
      { text: 'Use the knowledge to blackmail both factions', effect: 'blackmailer', influenceChange: null },
      { text: 'Offer to join the alliance as a third partner', effect: 'coalition_builder', influenceChange: null }
    ]
  },

  {
    id: 'resource-shortage',
    title: 'Resource Crisis',
    description: 'A critical supply shortage hits Neo Meridian. Whoever controls the remaining resources controls the city.',
    type: 'crisis',
    affectedFaction: null,
    triggerConditions: { minDay: 8, probability: 0.09 },
    effects: {
      factionPower: { [FACTION_IDS.TITAN]: +5, [FACTION_IDS.VANGUARD]: -5 },
      npcRelationships: {}
    },
    choices: [
      { text: 'Buy supplies and distribute to the people', effect: 'philanthropist', influenceChange: { faction: FACTION_IDS.VANGUARD, amount: 20 } },
      { text: 'Stockpile resources and sell at premium', effect: 'profiteer', influenceChange: { faction: FACTION_IDS.TITAN, amount: 10 } },
      { text: 'Organize a supply chain through the Syndicate', effect: 'smuggler', influenceChange: { faction: FACTION_IDS.SYNDICATE, amount: 12 } }
    ]
  }
];

export function getEligibleEvents(gameState) {
  return eventTemplates.filter(event => {
    const { minDay, probability, oneTime, requiredIntel } = event.triggerConditions;
    
    // Check day requirement
    if (gameState.player.day < minDay) return false;
    
    // Check if one-time event already fired
    if (oneTime && gameState.firedEvents?.includes(event.id)) return false;
    
    // Check probability
    if (Math.random() > probability) return false;
    
    // Check intel requirement
    if (requiredIntel && !gameState.intel?.some(i => i.id === requiredIntel)) return false;
    
    return true;
  });
}

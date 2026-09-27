/**
 * GameState — Central state manager for LiveIt.
 * Holds all game data: player, NPCs, factions, intel, events.
 * Emits events on state changes for reactive UI updates.
 */

import { eventBus } from './EventBus.js';
import { characters } from '../data/characters.js';
import { factions, RANKS } from '../data/factions.js';
import { locations } from '../data/locations.js';

export class GameState {
  constructor() {
    this.state = this._createInitialState();
  }

  _createInitialState() {
    // Build NPC states from character definitions
    const npcStates = {};
    for (const [id, char] of Object.entries(characters)) {
      npcStates[id] = {
        id: char.id,
        name: char.name,
        title: char.title,
        faction: char.faction,
        location: char.location,
        portrait: char.portrait,
        relationships: { ...char.initialRelationship },
        recruited: false,
        alive: true,
        spyMission: null,
        discoveredSecrets: []
      };
    }

    // Build faction states
    const factionStates = {};
    for (const [id, faction] of Object.entries(factions)) {
      factionStates[id] = {
        id: faction.id,
        name: faction.name,
        power: faction.initialPower,
        playerReputation: 0,
        playerInfluence: 0,
        playerRank: RANKS[0], // Outsider
        relations: { ...faction.initialRelations }
      };
    }

    return {
      player: {
        name: '',
        resources: { money: 150, intel: 0, influence: 5 },
        currentLocation: 'city-center',
        day: 1,
        totalActions: 0,
        actionsToday: 0,
        maxActionsPerDay: 5
      },
      npcs: npcStates,
      factions: factionStates,
      intel: [],
      eventLog: [],
      firedEvents: [],
      conversations: {},
      conversationSummaries: {},
      settings: {
        apiKey: '',
        model: 'llama-3.3-70b-versatile'
      },
      gameStarted: false,
      gameOver: false
    };
  }

  /**
   * Get the full state
   */
  getState() {
    return this.state;
  }

  /**
   * Initialize a new game with player name
   */
  startGame(playerName, apiKey) {
    this.state.player.name = playerName;
    this.state.settings.apiKey = apiKey;
    this.state.gameStarted = true;
    eventBus.emit('game:started', { playerName });
  }

  /**
   * Load state from saved data
   */
  loadState(savedState) {
    this.state = savedState;
    eventBus.emit('game:loaded', savedState);
  }

  // ═══════════════════════════════════════════
  //  PLAYER STATE
  // ═══════════════════════════════════════════

  movePlayer(locationId) {
    if (!locations[locationId]) return;
    const oldLocation = this.state.player.currentLocation;
    this.state.player.currentLocation = locationId;
    eventBus.emit('player:moved', { from: oldLocation, to: locationId });
  }

  addResources(resources) {
    for (const [key, amount] of Object.entries(resources)) {
      if (this.state.player.resources[key] !== undefined) {
        this.state.player.resources[key] = Math.max(0, this.state.player.resources[key] + amount);
      }
    }
    eventBus.emit('player:resourcesChanged', this.state.player.resources);
  }

  useAction() {
    this.state.player.actionsToday++;
    this.state.player.totalActions++;
    eventBus.emit('player:actionUsed', {
      remaining: this.state.player.maxActionsPerDay - this.state.player.actionsToday
    });
  }

  get actionsRemaining() {
    return this.state.player.maxActionsPerDay - this.state.player.actionsToday;
  }

  // ═══════════════════════════════════════════
  //  NPC STATE
  // ═══════════════════════════════════════════

  updateRelationship(npcId, changes) {
    const npc = this.state.npcs[npcId];
    if (!npc) return;

    const oldRel = { ...npc.relationships };

    for (const [key, delta] of Object.entries(changes)) {
      if (npc.relationships[key] !== undefined) {
        npc.relationships[key] = Math.min(100, Math.max(0, npc.relationships[key] + delta));
      }
    }

    eventBus.emit('npc:relationshipChanged', {
      npcId,
      oldRelationship: oldRel,
      newRelationship: { ...npc.relationships },
      changes
    });

    // Check for special thresholds
    this._checkRelationshipThresholds(npcId, oldRel, npc.relationships);
  }

  recruitNPC(npcId) {
    const npc = this.state.npcs[npcId];
    if (!npc || npc.recruited) return false;

    npc.recruited = true;
    eventBus.emit('npc:recruited', { npcId, name: npc.name });
    return true;
  }

  sendSpy(npcId, targetFaction) {
    const npc = this.state.npcs[npcId];
    if (!npc || !npc.recruited || npc.spyMission) return false;

    npc.spyMission = {
      targetFaction,
      startDay: this.state.player.day,
      duration: 2 + Math.floor(Math.random() * 3), // 2-4 days
      riskLevel: Math.random() * 0.4 + 0.1 // 10-50% catch chance
    };

    eventBus.emit('spy:sent', { npcId, targetFaction });
    return true;
  }

  getNPCsAtLocation(locationId) {
    return Object.values(this.state.npcs)
      .filter(npc => npc.location === locationId && npc.alive);
  }

  getRecruitedNPCs() {
    return Object.values(this.state.npcs).filter(npc => npc.recruited && npc.alive);
  }

  // ═══════════════════════════════════════════
  //  FACTION STATE
  // ═══════════════════════════════════════════

  updateFactionPower(factionId, delta) {
    const faction = this.state.factions[factionId];
    if (!faction) return;

    faction.power = Math.min(100, Math.max(0, faction.power + delta));
    eventBus.emit('faction:powerChanged', { factionId, power: faction.power });
  }

  updateFactionReputation(factionId, delta) {
    const faction = this.state.factions[factionId];
    if (!faction) return;

    const oldRep = faction.playerReputation;
    faction.playerReputation = Math.min(100, Math.max(-100, faction.playerReputation + delta));
    faction.playerInfluence = Math.max(0, Math.min(100, faction.playerInfluence + Math.floor(delta / 2)));

    // Check for rank changes
    this._checkRankProgression(factionId, oldRep, faction.playerReputation);

    eventBus.emit('faction:standingChanged', {
      factionId,
      reputation: faction.playerReputation,
      influence: faction.playerInfluence,
      rank: faction.playerRank
    });
  }

  // ═══════════════════════════════════════════
  //  INTEL & EVENTS
  // ═══════════════════════════════════════════

  addIntel(intel) {
    const newIntel = {
      id: `intel-${Date.now()}`,
      day: this.state.player.day,
      timestamp: Date.now(),
      ...intel
    };
    this.state.intel.unshift(newIntel);
    eventBus.emit('intel:gained', newIntel);
    this.addResources({ intel: 1 });
    return newIntel;
  }

  addEvent(event) {
    const logEntry = {
      id: event.id || `event-${Date.now()}`,
      day: this.state.player.day,
      timestamp: Date.now(),
      ...event
    };
    this.state.eventLog.unshift(logEntry);
    if (event.id) this.state.firedEvents.push(event.id);
    eventBus.emit('event:fired', logEntry);
    return logEntry;
  }

  // ═══════════════════════════════════════════
  //  DAY MANAGEMENT
  // ═══════════════════════════════════════════

  advanceDay() {
    this.state.player.day++;
    this.state.player.actionsToday = 0;

    // Passive resource gains
    this.addResources({ money: 10 + Math.floor(this.state.player.influence / 5) });

    // Process spy missions
    this._processSpyMissions();

    // Emit day advanced
    eventBus.emit('game:dayAdvanced', {
      day: this.state.player.day,
      actionsRemaining: this.state.player.maxActionsPerDay
    });
  }

  // ═══════════════════════════════════════════
  //  PRIVATE HELPERS
  // ═══════════════════════════════════════════

  _checkRelationshipThresholds(npcId, oldRel, newRel) {
    // Check if trust crossed 50 (unlock deeper dialogue)
    if (oldRel.trust < 50 && newRel.trust >= 50) {
      eventBus.emit('ui:notification', {
        type: 'success',
        message: `${this.state.npcs[npcId].name} is starting to trust you.`,
        icon: '🤝'
      });
    }

    // Check if fear crossed 70 (NPC becomes compliant)
    if (oldRel.fear < 70 && newRel.fear >= 70) {
      eventBus.emit('ui:notification', {
        type: 'warning',
        message: `${this.state.npcs[npcId].name} is terrified of you.`,
        icon: '😰'
      });
    }

    // Check if suspicion crossed 80 (risk of betrayal)
    if (oldRel.suspicion < 80 && newRel.suspicion >= 80) {
      eventBus.emit('ui:notification', {
        type: 'danger',
        message: `${this.state.npcs[npcId].name} is highly suspicious of you!`,
        icon: '⚠️'
      });
    }
  }

  _checkRankProgression(factionId, oldRep, newRep) {
    const faction = this.state.factions[factionId];
    const thresholds = [-100, -20, 10, 30, 55, 80]; // Reputation thresholds for each rank
    
    let newRankIdx = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (newRep >= thresholds[i]) {
        newRankIdx = i;
        break;
      }
    }

    const newRank = RANKS[Math.min(newRankIdx, RANKS.length - 1)];
    if (faction.playerRank !== newRank) {
      const oldRank = faction.playerRank;
      faction.playerRank = newRank;
      eventBus.emit('faction:rankChanged', {
        factionId,
        oldRank,
        newRank
      });
      eventBus.emit('ui:notification', {
        type: 'success',
        message: `Your rank in ${factions[factionId].name} changed: ${oldRank} → ${newRank}`,
        icon: '⬆️'
      });
    }
  }

  _processSpyMissions() {
    for (const npc of Object.values(this.state.npcs)) {
      if (!npc.spyMission) continue;

      const elapsed = this.state.player.day - npc.spyMission.startDay;
      
      if (elapsed >= npc.spyMission.duration) {
        // Mission complete
        const caught = Math.random() < npc.spyMission.riskLevel;

        if (caught) {
          // Spy was caught!
          npc.spyMission = null;
          npc.recruited = false;
          npc.relationships.trust = Math.max(0, npc.relationships.trust - 30);
          npc.relationships.fear += 20;
          
          eventBus.emit('spy:caught', {
            npcId: npc.id,
            targetFaction: npc.spyMission?.targetFaction
          });
          eventBus.emit('ui:notification', {
            type: 'danger',
            message: `${npc.name} was caught spying! They've turned against you.`,
            icon: '🚨'
          });
        } else {
          // Spy succeeded!
          const targetFaction = npc.spyMission.targetFaction;
          npc.spyMission = null;

          // Generate intel
          const factionData = factions[targetFaction];
          const intelTypes = [
            `${factionData.name} is planning a major operation in the coming days.`,
            `Internal tensions are rising within ${factionData.name}. Key members are dissatisfied.`,
            `${factionData.name}'s power base is ${this.state.factions[targetFaction].power > 70 ? 'strong but has hidden cracks' : 'weaker than they let on'}.`,
            `A secret meeting between ${factionData.name} and another faction was overheard.`,
            `${factionData.name}'s leader has a vulnerability that could be exploited.`
          ];
          
          const intelContent = intelTypes[Math.floor(Math.random() * intelTypes.length)];

          this.addIntel({
            type: 'spy_report',
            source: npc.name,
            targetFaction,
            content: intelContent
          });

          eventBus.emit('spy:reported', {
            npcId: npc.id,
            targetFaction,
            intel: intelContent
          });
          eventBus.emit('ui:notification', {
            type: 'success',
            message: `${npc.name} returned with intel from ${factionData.name}!`,
            icon: '🕵️'
          });
        }
      }
    }
  }
}

// Singleton
export const gameState = new GameState();

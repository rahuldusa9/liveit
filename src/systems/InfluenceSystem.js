/**
 * InfluenceSystem — Tracks and manages all relationship mechanics.
 */

import { gameState } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { factions } from '../data/factions.js';

export class InfluenceSystem {

  /**
   * Apply relationship changes from a dialogue analysis
   */
  static applyDialogueEffects(npcId, analysis) {
    const changes = {};
    
    if (analysis.trust_change) changes.trust = analysis.trust_change;
    if (analysis.fear_change) changes.fear = analysis.fear_change;
    if (analysis.respect_change) changes.respect = analysis.respect_change;
    if (analysis.suspicion_change) changes.suspicion = analysis.suspicion_change;

    if (Object.keys(changes).length > 0) {
      gameState.updateRelationship(npcId, changes);
    }

    // If intel was gained, add it
    if (analysis.intel_gained) {
      const npc = gameState.getState().npcs[npcId];
      gameState.addIntel({
        type: 'conversation',
        source: npc.name,
        targetFaction: npc.faction,
        content: analysis.intel_gained
      });
    }

    // If a secret was revealed, mark it
    if (analysis.revealed_secret) {
      const npcState = gameState.getState().npcs[npcId];
      if (!npcState.discoveredSecrets.includes('main_secret')) {
        npcState.discoveredSecrets.push('main_secret');
        eventBus.emit('ui:notification', {
          type: 'success',
          message: `${npcState.name} revealed a secret!`,
          icon: '🔓'
        });
      }
    }

    // Update faction reputation based on NPC interactions
    const npc = gameState.getState().npcs[npcId];
    if (npc && npc.faction) {
      const repChange = Math.floor((analysis.trust_change + analysis.respect_change) / 4);
      if (repChange !== 0) {
        gameState.updateFactionReputation(npc.faction, repChange);
      }
    }
  }

  /**
   * Apply effects from an event choice
   */
  static applyEventEffects(event, choiceIndex) {
    const choice = event.choices[choiceIndex];
    if (!choice) return;

    // Apply faction power changes
    if (event.effects.factionPower) {
      for (const [factionId, delta] of Object.entries(event.effects.factionPower)) {
        gameState.updateFactionPower(factionId, delta);
      }
    }

    // Apply NPC relationship changes
    if (event.effects.npcRelationships) {
      for (const [npcId, changes] of Object.entries(event.effects.npcRelationships)) {
        gameState.updateRelationship(npcId, changes);
      }
    }

    // Apply choice-specific influence change
    if (choice.influenceChange) {
      gameState.updateFactionReputation(
        choice.influenceChange.faction,
        choice.influenceChange.amount
      );
    }

    // Resource changes based on choice
    if (choice.effect === 'profiteer') {
      gameState.addResources({ money: 50 });
    } else if (choice.effect === 'philanthropist') {
      gameState.addResources({ money: -30 });
    }
  }

  /**
   * Check if an NPC can be recruited
   */
  static canRecruit(npcId) {
    const npc = gameState.getState().npcs[npcId];
    if (!npc || npc.recruited) return { canRecruit: false, reason: 'Already recruited' };

    const rel = npc.relationships;
    
    // Need high trust OR high fear
    if (rel.trust >= 60) return { canRecruit: true, reason: 'High trust' };
    if (rel.fear >= 70) return { canRecruit: true, reason: 'Intimidated into compliance' };
    if (rel.trust >= 40 && rel.respect >= 50) return { canRecruit: true, reason: 'Respects your leadership' };
    
    return {
      canRecruit: false,
      reason: `Need higher trust (${rel.trust}/60) or respect (${rel.respect}/50)`
    };
  }

  /**
   * Get influence summary for a faction
   */
  static getFactionSummary(factionId) {
    const state = gameState.getState();
    const factionState = state.factions[factionId];
    const faction = factions[factionId];
    
    if (!factionState || !faction) return null;

    const npcsInFaction = Object.values(state.npcs)
      .filter(n => n.faction === factionId);
    const recruitedCount = npcsInFaction.filter(n => n.recruited).length;
    const avgTrust = npcsInFaction.reduce((sum, n) => sum + n.relationships.trust, 0) / npcsInFaction.length;

    return {
      name: faction.name,
      power: factionState.power,
      reputation: factionState.playerReputation,
      influence: factionState.playerInfluence,
      rank: factionState.playerRank,
      recruited: recruitedCount,
      totalNPCs: npcsInFaction.length,
      avgTrust: Math.round(avgTrust),
      color: faction.color
    };
  }
}

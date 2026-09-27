/**
 * EventGenerator — Creates and fires dynamic world events based on game state.
 */

import { gameState } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { getEligibleEvents, eventTemplates } from '../data/events.js';
import { InfluenceSystem } from './InfluenceSystem.js';

export class EventGenerator {

  /**
   * Check and fire events for the current day.
   * Called when day advances.
   */
  static checkForEvents() {
    const state = gameState.getState();
    const eligible = getEligibleEvents(state);

    if (eligible.length === 0) return null;

    // Pick one random event from eligible ones
    const event = eligible[Math.floor(Math.random() * eligible.length)];
    
    // Log the event
    gameState.addEvent({
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      affectedFaction: event.affectedFaction,
      choices: event.choices,
      resolved: false
    });

    return event;
  }

  /**
   * Resolve an event with the player's choice
   */
  static resolveEvent(eventId, choiceIndex) {
    const state = gameState.getState();
    const eventLog = state.eventLog.find(e => e.id === eventId);
    
    if (!eventLog || eventLog.resolved) return;

    // Find the original event template for effects
    const template = eventTemplates.find(e => e.id === eventId);
    
    if (template) {
      InfluenceSystem.applyEventEffects(template, choiceIndex);
    }

    eventLog.resolved = true;
    eventLog.choiceIndex = choiceIndex;

    eventBus.emit('event:resolved', {
      eventId,
      choiceIndex,
      choice: eventLog.choices[choiceIndex]
    });
  }

  /**
   * Check for betrayal events based on NPC suspicion
   */
  static checkForBetrayals() {
    const state = gameState.getState();

    for (const npc of Object.values(state.npcs)) {
      if (!npc.alive) continue;

      // High suspicion + low fear = potential betrayal
      if (npc.relationships.suspicion >= 80 && npc.relationships.fear < 40) {
        const betrayalChance = (npc.relationships.suspicion - 70) * 0.02;
        
        if (Math.random() < betrayalChance) {
          // Betrayal!
          const wasRecruited = npc.recruited;
          npc.recruited = false;
          npc.relationships.trust = Math.max(0, npc.relationships.trust - 40);

          gameState.addEvent({
            title: `${npc.name} Betrays You!`,
            description: wasRecruited 
              ? `${npc.name} has turned against you and revealed your secrets to their faction!`
              : `${npc.name} has publicly denounced you and warned others about your manipulations!`,
            type: 'betrayal',
            affectedFaction: npc.faction,
            choices: [
              { text: 'Accept the blow and regroup', effect: 'accept' },
              { text: 'Retaliate immediately', effect: 'retaliate' },
              { text: 'Try to make amends', effect: 'reconcile' }
            ],
            resolved: false
          });

          // Faction reputation hit
          gameState.updateFactionReputation(npc.faction, -15);

          eventBus.emit('npc:betrayed', { npcId: npc.id, wasRecruited });

          return npc; // One betrayal per day max
        }
      }
    }

    return null;
  }
}

// Hook into day advancement
eventBus.on('game:dayAdvanced', () => {
  // Small delay to let other day-start effects process first
  setTimeout(() => {
    const event = EventGenerator.checkForEvents();
    EventGenerator.checkForBetrayals();
  }, 100);
});

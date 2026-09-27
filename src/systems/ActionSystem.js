/**
 * ActionSystem — Processes player actions (manipulate, threaten, bribe, etc.)
 * and applies game state effects.
 */

import { gameState } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { agentManager } from '../ai/AgentManager.js';
import { InfluenceSystem } from './InfluenceSystem.js';
import { characters } from '../data/characters.js';

export class ActionSystem {

  /**
   * Get available actions for an NPC based on current state
   */
  static getAvailableActions(npcId) {
    const state = gameState.getState();
    const npc = state.npcs[npcId];
    if (!npc || !npc.alive) return [];

    const actions = [
      {
        id: 'talk',
        name: 'Talk',
        icon: '💬',
        description: 'Have a conversation',
        available: true,
        cost: null
      },
      {
        id: 'manipulate',
        name: 'Manipulate',
        icon: '🎭',
        description: 'Steer the conversation to extract favors',
        available: true,
        cost: null
      },
      {
        id: 'threaten',
        name: 'Threaten',
        icon: '⚡',
        description: 'Use leverage to force compliance',
        available: state.player.resources.influence >= 5,
        cost: { influence: 5 }
      },
      {
        id: 'bribe',
        name: 'Bribe',
        icon: '💰',
        description: 'Spend money to buy loyalty',
        available: state.player.resources.money >= 25,
        cost: { money: 25 }
      }
    ];

    // Recruit action — only if conditions met
    const recruitCheck = InfluenceSystem.canRecruit(npcId);
    actions.push({
      id: 'recruit',
      name: 'Recruit',
      icon: '🤝',
      description: recruitCheck.canRecruit ? 'Convince them to join you' : recruitCheck.reason,
      available: recruitCheck.canRecruit,
      cost: null
    });

    // Spy action — only for recruited NPCs
    if (npc.recruited && !npc.spyMission) {
      actions.push({
        id: 'spy',
        name: 'Send as Spy',
        icon: '🕵️',
        description: 'Send to infiltrate another faction',
        available: true,
        cost: null,
        requiresTarget: true
      });
    }

    // Intel action — if we have intel about this NPC's faction
    const relevantIntel = state.intel.filter(i => i.targetFaction === npc.faction);
    if (relevantIntel.length > 0) {
      actions.push({
        id: 'interrogate',
        name: 'Confront with Intel',
        icon: '📋',
        description: 'Use gathered intelligence as leverage',
        available: true,
        cost: null
      });
    }

    return actions;
  }

  /**
   * Execute an action against an NPC
   */
  static async executeAction(npcId, actionId, playerMessage, onChunk = null, targetFaction = null) {
    const state = gameState.getState();
    
    // Check actions remaining
    if (state.player.actionsToday >= state.player.maxActionsPerDay) {
      eventBus.emit('ui:notification', {
        type: 'warning',
        message: 'No actions remaining today. Advance to the next day.',
        icon: '⏰'
      });
      return null;
    }

    // Handle spy action separately
    if (actionId === 'spy') {
      return ActionSystem._handleSpyAction(npcId, targetFaction);
    }

    // Pay costs
    const actions = ActionSystem.getAvailableActions(npcId);
    const action = actions.find(a => a.id === actionId);
    if (!action || !action.available) {
      eventBus.emit('ui:notification', {
        type: 'warning',
        message: 'This action is not available right now.',
        icon: '❌'
      });
      return null;
    }

    if (action.cost) {
      gameState.addResources(
        Object.fromEntries(
          Object.entries(action.cost).map(([k, v]) => [k, -v])
        )
      );
    }

    // Use an action
    gameState.useAction();

    // Add action-specific prefix to the player's message
    let modifiedMessage = playerMessage;
    if (actionId === 'threaten') {
      modifiedMessage = `[You speak with menacing authority] ${playerMessage}`;
    } else if (actionId === 'bribe') {
      modifiedMessage = `[You subtly offer compensation] ${playerMessage}`;
    } else if (actionId === 'manipulate') {
      modifiedMessage = `[You carefully choose your words to influence] ${playerMessage}`;
    } else if (actionId === 'recruit') {
      modifiedMessage = `[You make your pitch to bring them to your side] ${playerMessage}`;
    } else if (actionId === 'interrogate') {
      modifiedMessage = `[You confront them with intelligence you've gathered] ${playerMessage}`;
    }

    // Send to AI agent
    const result = await agentManager.sendMessage(
      npcId,
      modifiedMessage,
      state,
      actionId,
      onChunk
    );

    // Apply effects
    if (result?.analysis) {
      // Amplify effects based on action type
      const amplifiedAnalysis = ActionSystem._amplifyEffects(result.analysis, actionId);
      InfluenceSystem.applyDialogueEffects(npcId, amplifiedAnalysis);

      // Handle recruitment success
      if (actionId === 'recruit' && amplifiedAnalysis.trust_change > 0 && amplifiedAnalysis.mood !== 'hostile') {
        gameState.recruitNPC(npcId);
        gameState.addResources({ influence: 5 });
      }
    }

    return result;
  }

  /**
   * Amplify relationship effects based on action type
   */
  static _amplifyEffects(analysis, actionId) {
    const amplified = { ...analysis };

    switch (actionId) {
      case 'threaten':
        amplified.fear_change = Math.max(amplified.fear_change, 5);
        amplified.trust_change = Math.min(amplified.trust_change, -3);
        amplified.suspicion_change += 3;
        break;
      case 'bribe':
        amplified.trust_change += 3;
        break;
      case 'manipulate':
        amplified.suspicion_change += 2;
        break;
      case 'recruit':
        amplified.trust_change += 5;
        amplified.respect_change += 3;
        break;
    }

    return amplified;
  }

  /**
   * Handle spy deployment
   */
  static _handleSpyAction(npcId, targetFaction) {
    if (!targetFaction) {
      eventBus.emit('ui:notification', {
        type: 'warning',
        message: 'Select a target faction for the spy mission.',
        icon: '🎯'
      });
      return null;
    }

    const success = gameState.sendSpy(npcId, targetFaction);
    if (success) {
      gameState.useAction();
      const npc = gameState.getState().npcs[npcId];
      eventBus.emit('ui:notification', {
        type: 'info',
        message: `${npc.name} has been sent to infiltrate ${targetFaction}. They'll report back in a few days.`,
        icon: '🕵️'
      });
    }
    return { success };
  }
}

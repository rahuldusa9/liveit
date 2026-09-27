/**
 * AgentManager — Manages NPC AI agents.
 * Each NPC is a separate AI agent with unique personality,
 * conversation history, and dynamic system prompts.
 */

import { GroqClient } from './GroqClient.js';
import { ConversationMemory } from './ConversationMemory.js';
import { generateSystemPrompt, getActionContext, generateAnalysisPrompt } from './prompts.js';
import { characters } from '../data/characters.js';
import { eventBus } from '../engine/EventBus.js';

export class AgentManager {
  constructor() {
    this.groqClient = null;
    this.memory = new ConversationMemory();
    this.activeConversation = null; // Currently talking to which NPC
    this.isGenerating = false;
  }

  /**
   * Initialize with API key
   */
  initialize(apiKey, model) {
    this.groqClient = new GroqClient(apiKey, model);
  }

  /**
   * Load conversation history from saved state
   */
  loadState(savedConversations, savedSummaries) {
    this.memory.loadFromState(savedConversations, savedSummaries);
  }

  /**
   * Validate the API key
   */
  async validateKey() {
    if (!this.groqClient) return { valid: false, message: 'Client not initialized' };
    return await this.groqClient.validateKey();
  }

  /**
   * Send a message to an NPC and get a streamed response.
   * This is the main conversation method.
   * 
   * @param {string} npcId - The NPC to talk to
   * @param {string} playerMessage - What the player says
   * @param {object} gameState - Current game state
   * @param {string} action - Action type (talk, manipulate, threaten, etc.)
   * @param {function} onChunk - Callback for each streamed text chunk
   * @returns {object} { fullResponse, analysis }
   */
  async sendMessage(npcId, playerMessage, gameState, action = 'talk', onChunk = null) {
    if (!this.groqClient) throw new Error('AI not initialized. Please set your API key.');
    if (this.isGenerating) throw new Error('Already generating a response. Please wait.');
    
    this.isGenerating = true;
    this.activeConversation = npcId;

    try {
      const npc = characters[npcId];
      if (!npc) throw new Error(`Unknown NPC: ${npcId}`);

      // Build the action context
      const actionContext = getActionContext(action, npc, gameState);

      // Generate the system prompt with current game state
      const systemPrompt = generateSystemPrompt(npc, gameState, actionContext);

      // Get conversation history
      const history = this.memory.getMessages(npcId);

      // Build the messages array
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: playerMessage }
      ];

      // Add the player's message to memory
      this.memory.addMessage(npcId, 'user', playerMessage);

      let fullResponse = '';

      if (onChunk) {
        // Streaming mode
        for await (const chunk of this.groqClient.chatStream(messages)) {
          fullResponse += chunk;
          onChunk(chunk, fullResponse);
        }
      } else {
        // Non-streaming mode
        const result = await this.groqClient.chat(messages);
        fullResponse = result.content;
      }

      // Save the NPC's response to memory
      this.memory.addMessage(npcId, 'assistant', fullResponse);

      // Analyze the response for game effects
      const analysis = await this._analyzeResponse(fullResponse, action, npc);

      // Emit dialogue event
      eventBus.emit('dialogue:responseComplete', {
        npcId,
        response: fullResponse,
        action,
        analysis
      });

      return { fullResponse, analysis };
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Analyze an NPC's response to determine game effects
   * (relationship changes, secrets revealed, etc.)
   */
  async _analyzeResponse(npcResponse, action, npc) {
    // Default analysis if AI analysis fails
    const defaultAnalysis = {
      trust_change: action === 'talk' ? 2 : 0,
      fear_change: action === 'threaten' ? 5 : 0,
      respect_change: 0,
      suspicion_change: action === 'manipulate' ? 3 : 0,
      revealed_secret: false,
      intel_gained: null,
      mood: 'neutral'
    };

    try {
      const analysisPrompt = generateAnalysisPrompt(npcResponse, action, npc);
      const result = await this.groqClient.chat([
        { role: 'system', content: 'You are a game analysis engine. Return ONLY valid JSON. No other text.' },
        { role: 'user', content: analysisPrompt }
      ], { temperature: 0.2, maxTokens: 200 });

      // Try to parse JSON from the response
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          trust_change: clamp(parsed.trust_change || 0, -15, 15),
          fear_change: clamp(parsed.fear_change || 0, -10, 10),
          respect_change: clamp(parsed.respect_change || 0, -10, 10),
          suspicion_change: clamp(parsed.suspicion_change || 0, -15, 15),
          revealed_secret: !!parsed.revealed_secret,
          intel_gained: parsed.intel_gained || null,
          mood: parsed.mood || 'neutral'
        };
      }
    } catch (e) {
      console.warn('Failed to analyze response, using defaults:', e.message);
    }

    return defaultAnalysis;
  }

  /**
   * Get a brief NPC greeting based on relationship
   */
  getGreeting(npcId, gameState) {
    const npc = characters[npcId];
    if (!npc) return '';

    const relationship = gameState.npcs[npcId]?.relationships || npc.initialRelationship;
    const hasHistory = this.memory.hasHistory(npcId);
    const playerName = gameState.player?.name || 'stranger';

    if (!hasHistory) {
      if (relationship.suspicion > 50) return `*eyes you warily* And you are...?`;
      if (relationship.trust > 20) return `*nods* What can I do for you?`;
      return `*looks up* Yes?`;
    }

    if (relationship.trust >= 60) return `*smiles* ${playerName}. Good to see you again.`;
    if (relationship.trust >= 30) return `*acknowledges you* Back again, ${playerName}?`;
    if (relationship.fear >= 50) return `*tenses up* ${playerName}... what do you want?`;
    if (relationship.suspicion >= 60) return `*narrows eyes* You again. What are you really after?`;
    return `*glances at you* ${playerName}.`;
  }

  /**
   * Export memory state for saving
   */
  exportState() {
    return this.memory.exportState();
  }

  /**
   * Check if currently generating
   */
  get isBusy() {
    return this.isGenerating;
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Singleton
export const agentManager = new AgentManager();

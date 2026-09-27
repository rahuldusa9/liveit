/**
 * DialoguePanel — AI conversation interface with streaming responses
 */

import { eventBus } from '../../engine/EventBus.js';
import { gameState } from '../../engine/GameState.js';
import { agentManager } from '../../ai/AgentManager.js';
import { ActionSystem } from '../../systems/ActionSystem.js';
import { characters } from '../../data/characters.js';
import { factions } from '../../data/factions.js';

export class DialoguePanel {
  constructor(container) {
    this.container = container;
    this.currentNPCId = null;
    this.currentAction = 'talk';
    this.isOpen = false;
    this.currentMood = 'neutral';
    this.render();
    this._bindEvents();
  }

  render() {
    this.container.className = `dialogue-panel ${this.isOpen ? 'open' : ''}`;
    
    if (!this.isOpen || !this.currentNPCId) {
      this.container.innerHTML = '';
      return;
    }

    const npc = characters[this.currentNPCId];
    const npcState = gameState.getState().npcs[this.currentNPCId];
    const faction = factions[npc?.faction];

    this.container.innerHTML = `
      <div class="dialogue-header">
        <div class="dialogue-npc-info">
          <div class="dialogue-npc-portrait">${npcState?.portrait || '👤'}</div>
          <div>
            <div class="dialogue-npc-name" style="color: ${faction?.color || 'inherit'}">${npc?.name || 'Unknown'}</div>
            <div class="dialogue-npc-title">${npc?.title || ''}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="dialogue-mood ${this.currentMood}" id="dialogue-mood">${this.currentMood}</span>
          <button class="btn btn-secondary btn-sm" id="btn-close-dialogue">✕</button>
        </div>
      </div>
      <div class="dialogue-messages" id="dialogue-messages"></div>
      <div class="dialogue-input-area">
        <select class="dialogue-action-select" id="dialogue-action" style="
          padding: 10px;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.78rem;
          outline: none;
          cursor: pointer;
          min-width: 110px;
        ">
          <option value="talk">💬 Talk</option>
          <option value="manipulate">🎭 Manipulate</option>
          <option value="threaten">⚡ Threaten</option>
          <option value="bribe">💰 Bribe</option>
          <option value="interrogate">📋 Confront</option>
        </select>
        <input type="text" class="dialogue-input" id="dialogue-input" 
               placeholder="Type your message..." autocomplete="off" />
        <button class="dialogue-send-btn" id="btn-send">SEND</button>
      </div>
    `;

    // Restore messages from memory
    this._restoreMessages();

    // Bind dialogue events
    document.getElementById('btn-close-dialogue').addEventListener('click', () => {
      this.close();
    });

    document.getElementById('dialogue-action').addEventListener('change', (e) => {
      this.currentAction = e.target.value;
    });

    document.getElementById('btn-send').addEventListener('click', () => {
      this._sendMessage();
    });

    document.getElementById('dialogue-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._sendMessage();
      }
    });
  }

  open(npcId) {
    this.currentNPCId = npcId;
    this.currentAction = 'talk';
    this.currentMood = 'neutral';
    this.isOpen = true;
    this.render();

    // Show greeting if first time
    const state = gameState.getState();
    const greeting = agentManager.getGreeting(npcId, state);
    if (greeting) {
      this._addMessage('system', greeting);
    }

    // Focus input
    setTimeout(() => {
      document.getElementById('dialogue-input')?.focus();
    }, 100);

    eventBus.emit('dialogue:opened', { npcId });
  }

  close() {
    this.isOpen = false;
    this.currentNPCId = null;
    this.render();
    eventBus.emit('dialogue:closed', {});
  }

  async _sendMessage() {
    const input = document.getElementById('dialogue-input');
    const sendBtn = document.getElementById('btn-send');
    const message = input?.value?.trim();

    if (!message || agentManager.isBusy) return;

    const state = gameState.getState();

    // Check actions remaining
    if (state.player.actionsToday >= state.player.maxActionsPerDay) {
      eventBus.emit('ui:notification', {
        type: 'warning',
        message: 'No actions remaining today. Advance to the next day.',
        icon: '⏰'
      });
      return;
    }

    // Show player message
    this._addMessage('player', message);
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;

    // Show typing indicator
    this._showTyping();

    try {
      // Create a placeholder for streaming response
      const npcMessageEl = this._addMessage('npc', '', true);

      const result = await ActionSystem.executeAction(
        this.currentNPCId,
        this.currentAction,
        message,
        // Streaming callback
        (chunk, fullText) => {
          npcMessageEl.textContent = fullText;
          this._scrollToBottom();
        }
      );

      // Remove typing indicator (it should be replaced by the streamed message)
      this._hideTyping();

      // If no streaming was used, set the full response
      if (result?.fullResponse && !npcMessageEl.textContent) {
        npcMessageEl.textContent = result.fullResponse;
      }

      // Update mood
      if (result?.analysis?.mood) {
        this.currentMood = result.analysis.mood;
        const moodEl = document.getElementById('dialogue-mood');
        if (moodEl) {
          moodEl.className = `dialogue-mood ${this.currentMood}`;
          moodEl.textContent = this.currentMood;
        }
      }

      // Show relationship changes
      if (result?.analysis) {
        const changes = [];
        if (result.analysis.trust_change > 0) changes.push(`Trust +${result.analysis.trust_change}`);
        if (result.analysis.trust_change < 0) changes.push(`Trust ${result.analysis.trust_change}`);
        if (result.analysis.fear_change > 0) changes.push(`Fear +${result.analysis.fear_change}`);
        if (result.analysis.respect_change > 0) changes.push(`Respect +${result.analysis.respect_change}`);
        if (result.analysis.suspicion_change > 0) changes.push(`Suspicion +${result.analysis.suspicion_change}`);
        
        if (changes.length > 0) {
          this._addMessage('system', `[${changes.join(' | ')}]`);
        }
      }

    } catch (error) {
      this._hideTyping();
      this._addMessage('system', `⚠️ ${error.message}`);
      console.error('Dialogue error:', error);
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  _addMessage(type, content, isStreaming = false) {
    const messagesEl = document.getElementById('dialogue-messages');
    if (!messagesEl) return null;

    const msgEl = document.createElement('div');
    msgEl.className = `dialogue-message ${type}`;
    msgEl.textContent = content;
    
    if (isStreaming) {
      msgEl.id = 'streaming-message';
    }

    messagesEl.appendChild(msgEl);
    this._scrollToBottom();
    return msgEl;
  }

  _showTyping() {
    const messagesEl = document.getElementById('dialogue-messages');
    if (!messagesEl) return;

    const typing = document.createElement('div');
    typing.className = 'dialogue-typing';
    typing.id = 'typing-indicator';
    typing.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
    messagesEl.appendChild(typing);
    this._scrollToBottom();
  }

  _hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  }

  _scrollToBottom() {
    const messagesEl = document.getElementById('dialogue-messages');
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  _restoreMessages() {
    if (!this.currentNPCId) return;
    
    const memory = agentManager.memory;
    const messages = memory.getRecentMessages(this.currentNPCId, 20);
    
    for (const msg of messages) {
      this._addMessage(msg.role === 'user' ? 'player' : 'npc', msg.content);
    }
  }

  _bindEvents() {
    eventBus.on('npc:startDialogue', ({ npcId }) => {
      this.open(npcId);
    });
  }
}

/**
 * SetupScreen — Initial screen for API key, player name, and game start/load
 */

import { gameState } from '../../engine/GameState.js';
import { agentManager } from '../../ai/AgentManager.js';
import { SaveSystem } from '../../engine/SaveSystem.js';
import { eventBus } from '../../engine/EventBus.js';

export class SetupScreen {
  constructor(container) {
    this.container = container;
    this.render();
  }

  render() {
    const savedApiKey = SaveSystem.getSavedApiKey();
    const saveInfo = SaveSystem.getSaveInfo();

    this.container.innerHTML = `
      <div class="setup-screen">
        <div class="setup-bg"></div>
        <div class="setup-container">
          <div class="setup-logo">
            <h1 class="setup-title">LiveIt</h1>
            <p class="setup-subtitle">Rise to Power</p>
          </div>

          <div class="setup-card">
            ${saveInfo ? `
              <div class="setup-continue-info">
                <p>📂 Save found: <strong>${saveInfo.playerName}</strong> — Day ${saveInfo.day}</p>
                <p style="margin-top: 4px; font-size: 0.75rem;">Saved: ${saveInfo.date}</p>
              </div>
            ` : ''}

            <div class="setup-field">
              <label for="setup-api-key">Groq API Key</label>
              <input type="password" id="setup-api-key" 
                     placeholder="gsk_..." 
                     value="${savedApiKey || ''}"
                     autocomplete="off" />
              <div class="field-hint">🔒 Stored locally only. Never sent anywhere except Groq.</div>
              <div class="setup-error" id="setup-error"></div>
              <div class="setup-validating hidden" id="setup-validating">Validating API key...</div>
            </div>

            <div class="setup-field">
              <label for="setup-name">Your Name</label>
              <input type="text" id="setup-name" 
                     placeholder="Enter your name, leader..." 
                     value="${saveInfo?.playerName || ''}"
                     autocomplete="off" />
            </div>

            <div class="setup-actions">
              ${saveInfo ? `
                <button class="btn btn-primary" id="btn-continue" style="width: 100%;">
                  ▶ Continue Game
                </button>
                <button class="btn btn-secondary" id="btn-new-game" style="width: 100%;">
                  + New Game
                </button>
              ` : `
                <button class="btn btn-primary" id="btn-new-game" style="width: 100%;">
                  ⚔ Enter Neo Meridian City
                </button>
              `}
            </div>
          </div>

          <p style="color: var(--text-muted); font-size: 0.72rem; margin-top: 24px; line-height: 1.6;">
            An AI-powered political strategy game. Every character is a unique AI agent.<br>
            Talk. Manipulate. Rise.
          </p>
        </div>
      </div>
    `;

    // Bind events
    const continueBtn = document.getElementById('btn-continue');
    const newGameBtn = document.getElementById('btn-new-game');

    if (continueBtn) {
      continueBtn.addEventListener('click', () => this._continueGame());
    }

    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => this._startNewGame());
    }

    // Focus appropriate field
    setTimeout(() => {
      if (!savedApiKey) {
        document.getElementById('setup-api-key')?.focus();
      } else if (!saveInfo) {
        document.getElementById('setup-name')?.focus();
      }
    }, 100);
  }

  async _validateAndGetKey() {
    const apiKeyInput = document.getElementById('setup-api-key');
    const errorEl = document.getElementById('setup-error');
    const validatingEl = document.getElementById('setup-validating');
    const apiKey = apiKeyInput?.value?.trim();

    if (!apiKey) {
      errorEl.textContent = 'Please enter your Groq API key.';
      return null;
    }

    // Show validating state
    errorEl.textContent = '';
    validatingEl.classList.remove('hidden');

    // Initialize and validate
    agentManager.initialize(apiKey);
    const result = await agentManager.validateKey();

    validatingEl.classList.add('hidden');

    if (!result.valid) {
      errorEl.textContent = `Invalid API key: ${result.message}`;
      return null;
    }

    return apiKey;
  }

  async _continueGame() {
    const apiKey = await this._validateAndGetKey();
    if (!apiKey) return;

    const saveData = SaveSystem.load();
    if (!saveData) {
      document.getElementById('setup-error').textContent = 'No save data found.';
      return;
    }

    saveData.state.settings.apiKey = apiKey;
    SaveSystem.applySave(saveData);

    eventBus.emit('ui:screenChanged', { screen: 'game' });
  }

  async _startNewGame() {
    const apiKey = await this._validateAndGetKey();
    if (!apiKey) return;

    const nameInput = document.getElementById('setup-name');
    const name = nameInput?.value?.trim();

    if (!name) {
      document.getElementById('setup-error').textContent = 'Please enter your name.';
      return;
    }

    // Delete old save if exists
    SaveSystem.deleteSave();

    // Start fresh game
    gameState.startGame(name, apiKey);
    agentManager.initialize(apiKey);

    eventBus.emit('ui:screenChanged', { screen: 'game' });
  }
}

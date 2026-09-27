/**
 * SaveSystem — Persists game state to localStorage
 */

import { gameState } from './GameState.js';
import { agentManager } from '../ai/AgentManager.js';
import { eventBus } from './EventBus.js';

const SAVE_KEY = 'liveit_save';
const SETTINGS_KEY = 'liveit_settings';

export class SaveSystem {

  /**
   * Save the current game state
   */
  static save() {
    try {
      const state = gameState.getState();
      const aiState = agentManager.exportState();

      const saveData = {
        version: 1,
        timestamp: Date.now(),
        state: {
          ...state,
          settings: { ...state.settings, apiKey: '' } // Don't save API key in main save
        },
        ai: aiState
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      
      // Save API key separately (still in localStorage but separated)
      if (state.settings.apiKey) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
          apiKey: state.settings.apiKey,
          model: state.settings.model
        }));
      }

      eventBus.emit('game:saved', { timestamp: saveData.timestamp });
      eventBus.emit('ui:notification', {
        type: 'success',
        message: 'Game saved successfully!',
        icon: '💾'
      });

      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      eventBus.emit('ui:notification', {
        type: 'danger',
        message: 'Failed to save game!',
        icon: '❌'
      });
      return false;
    }
  }

  /**
   * Load a saved game
   */
  static load() {
    try {
      const saveJson = localStorage.getItem(SAVE_KEY);
      if (!saveJson) return null;

      const saveData = JSON.parse(saveJson);

      // Load settings (API key)
      const settingsJson = localStorage.getItem(SETTINGS_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        saveData.state.settings = { ...saveData.state.settings, ...settings };
      }

      return saveData;
    } catch (error) {
      console.error('Failed to load save:', error);
      return null;
    }
  }

  /**
   * Apply a loaded save to game state
   */
  static applySave(saveData) {
    if (!saveData) return false;

    try {
      // Restore game state
      gameState.loadState(saveData.state);

      // Restore AI state
      if (saveData.ai) {
        agentManager.loadState(saveData.ai.conversations, saveData.ai.summaries);
      }

      // Re-initialize AI client
      if (saveData.state.settings.apiKey) {
        agentManager.initialize(saveData.state.settings.apiKey, saveData.state.settings.model);
      }

      return true;
    } catch (error) {
      console.error('Failed to apply save:', error);
      return false;
    }
  }

  /**
   * Check if a save exists
   */
  static hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Get save metadata without loading full state
   */
  static getSaveInfo() {
    try {
      const saveJson = localStorage.getItem(SAVE_KEY);
      if (!saveJson) return null;

      const saveData = JSON.parse(saveJson);
      return {
        timestamp: saveData.timestamp,
        day: saveData.state?.player?.day || 1,
        playerName: saveData.state?.player?.name || 'Unknown',
        date: new Date(saveData.timestamp).toLocaleString()
      };
    } catch {
      return null;
    }
  }

  /**
   * Delete save data
   */
  static deleteSave() {
    localStorage.removeItem(SAVE_KEY);
    eventBus.emit('ui:notification', {
      type: 'info',
      message: 'Save data deleted.',
      icon: '🗑️'
    });
  }

  /**
   * Get saved API key
   */
  static getSavedApiKey() {
    try {
      const settingsJson = localStorage.getItem(SETTINGS_KEY);
      if (!settingsJson) return null;
      return JSON.parse(settingsJson).apiKey || null;
    } catch {
      return null;
    }
  }

  /**
   * Auto-save every N actions
   */
  static enableAutoSave(interval = 3) {
    let actionCount = 0;
    eventBus.on('player:actionUsed', () => {
      actionCount++;
      if (actionCount >= interval) {
        actionCount = 0;
        SaveSystem.save();
      }
    });

    // Also save on day advance
    eventBus.on('game:dayAdvanced', () => {
      SaveSystem.save();
    });
  }
}

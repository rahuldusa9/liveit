/**
 * GameScreen — Main game layout with HUD, World Map, Dialogue, and Context Panel
 */

import { HUD } from '../components/HUD.js';
import { WorldMap } from '../components/WorldMap.js';
import { DialoguePanel } from '../components/DialoguePanel.js';
import { ContextPanel } from '../components/ContextPanel.js';
import { SaveSystem } from '../../engine/SaveSystem.js';
import { eventBus } from '../../engine/EventBus.js';

export class GameScreen {
  constructor(container) {
    this.container = container;
    this.render();

    // Enable auto-save
    SaveSystem.enableAutoSave(3);
  }

  render() {
    this.container.innerHTML = `
      <div class="game-screen">
        <div class="hud" id="hud-container"></div>
        <div class="main-content">
          <div class="world-map-container" id="map-container">
            <div class="world-map" id="world-map"></div>
          </div>
          <div id="dialogue-container"></div>
        </div>
        <div class="context-panel" id="context-panel"></div>
      </div>
    `;

    // Initialize components
    this.hud = new HUD(document.getElementById('hud-container'));
    this.worldMap = new WorldMap(document.getElementById('world-map'));
    this.dialoguePanel = new DialoguePanel(document.getElementById('dialogue-container'));
    this.contextPanel = new ContextPanel(document.getElementById('context-panel'));

    // Link dialogue opening from context panel
    eventBus.on('npc:startDialogue', ({ npcId }) => {
      this.dialoguePanel.open(npcId);
    });
  }
}

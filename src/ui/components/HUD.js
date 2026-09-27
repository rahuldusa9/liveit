/**
 * HUD — Top bar showing player stats, resources, day counter, and actions remaining
 */

import { eventBus } from '../../engine/EventBus.js';
import { gameState } from '../../engine/GameState.js';
import { SaveSystem } from '../../engine/SaveSystem.js';

export class HUD {
  constructor(container) {
    this.container = container;
    this.render();
    this._bindEvents();
  }

  render() {
    const state = gameState.getState();
    const player = state.player;
    const actionsLeft = player.maxActionsPerDay - player.actionsToday;

    this.container.innerHTML = `
      <div class="hud-left">
        <div class="hud-logo">LIVEIT</div>
        <div class="hud-player">
          <span>👤</span>
          <span class="player-name">${player.name}</span>
        </div>
      </div>
      <div class="hud-center">
        <div class="hud-stat">
          <span class="stat-icon">💰</span>
          <div>
            <div class="stat-value" id="hud-money">${player.resources.money}</div>
            <div class="stat-label">Money</div>
          </div>
        </div>
        <div class="hud-stat">
          <span class="stat-icon">🔍</span>
          <div>
            <div class="stat-value" id="hud-intel">${player.resources.intel}</div>
            <div class="stat-label">Intel</div>
          </div>
        </div>
        <div class="hud-stat">
          <span class="stat-icon">⭐</span>
          <div>
            <div class="stat-value" id="hud-influence">${player.resources.influence}</div>
            <div class="stat-label">Influence</div>
          </div>
        </div>
        <div class="hud-actions-remaining">
          <span>Actions:</span>
          <div class="action-dots">
            ${Array.from({ length: player.maxActionsPerDay }, (_, i) =>
              `<div class="action-dot ${i >= actionsLeft ? 'used' : ''}" id="action-dot-${i}"></div>`
            ).join('')}
          </div>
        </div>
      </div>
      <div class="hud-right">
        <div class="hud-day" id="hud-day">DAY ${player.day}</div>
        <button class="btn btn-primary btn-sm" id="btn-next-day">Next Day ▶</button>
        <button class="btn btn-secondary btn-sm btn-icon" id="btn-save" title="Save Game">💾</button>
      </div>
    `;

    // Bind button events
    document.getElementById('btn-next-day').addEventListener('click', () => {
      gameState.advanceDay();
    });

    document.getElementById('btn-save').addEventListener('click', () => {
      SaveSystem.save();
    });
  }

  _bindEvents() {
    eventBus.on('player:resourcesChanged', (resources) => {
      const moneyEl = document.getElementById('hud-money');
      const intelEl = document.getElementById('hud-intel');
      const influenceEl = document.getElementById('hud-influence');
      if (moneyEl) moneyEl.textContent = resources.money;
      if (intelEl) intelEl.textContent = resources.intel;
      if (influenceEl) influenceEl.textContent = resources.influence;
    });

    eventBus.on('player:actionUsed', ({ remaining }) => {
      const state = gameState.getState();
      for (let i = 0; i < state.player.maxActionsPerDay; i++) {
        const dot = document.getElementById(`action-dot-${i}`);
        if (dot) {
          dot.classList.toggle('used', i >= remaining);
        }
      }
    });

    eventBus.on('game:dayAdvanced', ({ day }) => {
      const dayEl = document.getElementById('hud-day');
      if (dayEl) dayEl.textContent = `DAY ${day}`;
      // Reset action dots
      const state = gameState.getState();
      for (let i = 0; i < state.player.maxActionsPerDay; i++) {
        const dot = document.getElementById(`action-dot-${i}`);
        if (dot) dot.classList.remove('used');
      }
    });
  }
}

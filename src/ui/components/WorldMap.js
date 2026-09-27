/**
 * WorldMap — Interactive SVG-based city map with district zones and NPC markers
 */

import { eventBus } from '../../engine/EventBus.js';
import { gameState } from '../../engine/GameState.js';
import { locations } from '../../data/locations.js';
import { factions } from '../../data/factions.js';

export class WorldMap {
  constructor(container) {
    this.container = container;
    this.activeDistrict = null;
    this.render();
    this._bindEvents();
  }

  render() {
    const state = gameState.getState();
    const currentLocation = state.player.currentLocation;

    // District layout positions (percentage-based)
    const districtLayout = {
      'government-quarter': { x: 12, y: 18, w: 32, h: 32 },
      'media-tower':        { x: 34, y: 5, w: 32, h: 25 },
      'financial-district': { x: 56, y: 18, w: 32, h: 32 },
      'outer-districts':    { x: 8, y: 55, w: 35, h: 35 },
      'city-center':        { x: 35, y: 38, w: 30, h: 24 },
      'the-docks':          { x: 57, y: 55, w: 35, h: 35 }
    };

    let html = '<div class="map-grid-overlay"></div>';

    // Connection lines SVG
    html += `
      <svg class="district-connections" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="28" y1="34" x2="42" y2="45" />
        <line x1="72" y1="34" x2="58" y2="45" />
        <line x1="25" y1="55" x2="40" y2="52" />
        <line x1="75" y1="55" x2="60" y2="52" />
        <line x1="50" y1="17" x2="50" y2="38" />
        <line x1="28" y1="50" x2="25" y2="55" />
        <line x1="72" y1="50" x2="75" y2="55" />
      </svg>
    `;

    // District zones
    for (const [locId, loc] of Object.entries(locations)) {
      const layout = districtLayout[locId];
      if (!layout) continue;

      const faction = loc.faction ? factions[loc.faction] : null;
      const color = faction?.color || '#666';
      const colorRgb = faction?.colorRgb || '102, 102, 102';
      const npcsHere = gameState.getNPCsAtLocation(locId);
      const isActive = currentLocation === locId;

      html += `
        <div class="district-zone ${isActive ? 'active' : ''}"
             data-location="${locId}"
             style="
               left: ${layout.x}%;
               top: ${layout.y}%;
               width: ${layout.w}%;
               height: ${layout.h}%;
               --district-color: ${color};
               --district-color-rgb: ${colorRgb};
             ">
          <div class="district-icon">${loc.icon}</div>
          <div class="district-name">${loc.shortName}</div>
          ${faction ? `<div class="district-faction">${faction.shortName}</div>` : '<div class="district-faction">Neutral</div>'}
          <div class="district-npc-count">${npcsHere.length} contacts</div>
        </div>
      `;
    }

    // Player marker
    const currentLoc = locations[currentLocation];
    const currentLayout = districtLayout[currentLocation];
    if (currentLayout) {
      html += `
        <div class="player-marker" style="
          left: ${currentLayout.x + currentLayout.w / 2}%;
          top: ${currentLayout.y + currentLayout.h / 2 - 5}%;
        "></div>
      `;
    }

    this.container.innerHTML = html;

    // Add click handlers to districts
    this.container.querySelectorAll('.district-zone').forEach(zone => {
      zone.addEventListener('click', () => {
        const locationId = zone.dataset.location;
        this._selectDistrict(locationId);
      });
    });
  }

  _selectDistrict(locationId) {
    const state = gameState.getState();
    
    // Move player to this location
    gameState.movePlayer(locationId);
    
    // Update active state visually
    this.container.querySelectorAll('.district-zone').forEach(z => {
      z.classList.toggle('active', z.dataset.location === locationId);
    });

    // Move player marker
    const districtLayout = {
      'government-quarter': { x: 12, y: 18, w: 32, h: 32 },
      'media-tower':        { x: 34, y: 5, w: 32, h: 25 },
      'financial-district': { x: 56, y: 18, w: 32, h: 32 },
      'outer-districts':    { x: 8, y: 55, w: 35, h: 35 },
      'city-center':        { x: 35, y: 38, w: 30, h: 24 },
      'the-docks':          { x: 57, y: 55, w: 35, h: 35 }
    };

    const layout = districtLayout[locationId];
    const marker = this.container.querySelector('.player-marker');
    if (marker && layout) {
      marker.style.left = `${layout.x + layout.w / 2}%`;
      marker.style.top = `${layout.y + layout.h / 2 - 5}%`;
    }

    // Emit event for context panel to update
    eventBus.emit('map:districtSelected', { locationId });
  }

  _bindEvents() {
    eventBus.on('player:moved', () => {
      // Re-render map to update NPC counts etc
      this.render();
    });
  }
}

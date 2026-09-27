/**
 * ContextPanel — Right-side panel with tabs for Characters, Factions, Intel, and Events
 */

import { eventBus } from '../../engine/EventBus.js';
import { gameState } from '../../engine/GameState.js';
import { characters } from '../../data/characters.js';
import { factions, RANKS } from '../../data/factions.js';
import { locations } from '../../data/locations.js';
import { ActionSystem } from '../../systems/ActionSystem.js';
import { InfluenceSystem } from '../../systems/InfluenceSystem.js';
import { getEligibleEvents } from '../../data/events.js';

export class ContextPanel {
  constructor(container) {
    this.container = container;
    this.activeTab = 'characters';
    this.selectedNPCId = null;
    this.render();
    this._bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="context-tabs">
        <button class="context-tab ${this.activeTab === 'characters' ? 'active' : ''}" data-tab="characters">
          👥 People
        </button>
        <button class="context-tab ${this.activeTab === 'factions' ? 'active' : ''}" data-tab="factions">
          ⚔️ Factions
        </button>
        <button class="context-tab ${this.activeTab === 'intel' ? 'active' : ''}" data-tab="intel">
          🔍 Intel
        </button>
        <button class="context-tab ${this.activeTab === 'events' ? 'active' : ''}" data-tab="events">
          📋 Events
        </button>
      </div>
      <div class="context-content" id="context-content"></div>
    `;

    // Tab click handlers
    this.container.querySelectorAll('.context-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.dataset.tab;
        this.selectedNPCId = null;
        this.render();
      });
    });

    // Render active tab content
    this._renderTabContent();
  }

  _renderTabContent() {
    const contentEl = document.getElementById('context-content');
    if (!contentEl) return;

    switch (this.activeTab) {
      case 'characters':
        this.selectedNPCId ? this._renderCharacterDetail(contentEl) : this._renderCharacterList(contentEl);
        break;
      case 'factions':
        this._renderFactionList(contentEl);
        break;
      case 'intel':
        this._renderIntelBoard(contentEl);
        break;
      case 'events':
        this._renderEventFeed(contentEl);
        break;
    }
  }

  _renderCharacterList(contentEl) {
    const state = gameState.getState();
    const currentLocation = state.player.currentLocation;
    const npcsHere = gameState.getNPCsAtLocation(currentLocation);
    const loc = locations[currentLocation];

    let html = `
      <div style="margin-bottom: 12px;">
        <div style="font-family: var(--font-display); font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">
          ${loc?.icon || ''} ${loc?.name || 'Unknown Location'}
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">${loc?.description || ''}</div>
      </div>
    `;

    if (npcsHere.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state-icon">🏙️</div>
          <div class="empty-state-text">No one of interest here. Try visiting a faction's territory.</div>
        </div>
      `;
    } else {
      html += '<div class="character-list">';
      for (const npc of npcsHere) {
        const charData = characters[npc.id];
        const faction = factions[npc.faction];
        const rel = npc.relationships;

        html += `
          <div class="character-card" data-npc-id="${npc.id}">
            <div class="character-portrait">${npc.portrait}</div>
            <div class="character-info">
              <div class="character-name">${npc.name}</div>
              <div class="character-title">${npc.title}</div>
              <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px;">
                <span class="character-faction-badge" style="background: rgba(${faction?.colorRgb || '255,255,255'}, 0.15); color: ${faction?.color || 'inherit'}">
                  ${faction?.shortName || 'None'}
                </span>
                ${npc.recruited ? '<span class="character-recruited-badge">✓ Allied</span>' : ''}
                ${npc.spyMission ? '<span class="character-recruited-badge" style="background: rgba(139,92,246,0.15); color: #8B5CF6;">🕵️ On Mission</span>' : ''}
              </div>
              <div class="relationship-bars">
                <div class="rel-bar">
                  <span class="rel-bar-label">T</span>
                  <div class="rel-bar-track"><div class="rel-bar-fill trust" style="width: ${rel.trust}%"></div></div>
                  <span class="rel-bar-value">${rel.trust}</span>
                </div>
                <div class="rel-bar">
                  <span class="rel-bar-label">F</span>
                  <div class="rel-bar-track"><div class="rel-bar-fill fear" style="width: ${rel.fear}%"></div></div>
                  <span class="rel-bar-value">${rel.fear}</span>
                </div>
                <div class="rel-bar">
                  <span class="rel-bar-label">R</span>
                  <div class="rel-bar-track"><div class="rel-bar-fill respect" style="width: ${rel.respect}%"></div></div>
                  <span class="rel-bar-value">${rel.respect}</span>
                </div>
                <div class="rel-bar">
                  <span class="rel-bar-label">S</span>
                  <div class="rel-bar-track"><div class="rel-bar-fill suspicion" style="width: ${rel.suspicion}%"></div></div>
                  <span class="rel-bar-value">${rel.suspicion}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }
      html += '</div>';
    }

    contentEl.innerHTML = html;

    // Click handlers for character cards
    contentEl.querySelectorAll('.character-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectedNPCId = card.dataset.npcId;
        this.render();
      });
    });
  }

  _renderCharacterDetail(contentEl) {
    const state = gameState.getState();
    const npc = state.npcs[this.selectedNPCId];
    const charData = characters[this.selectedNPCId];
    const faction = factions[npc?.faction];
    const rel = npc?.relationships || {};

    if (!npc || !charData) {
      this.selectedNPCId = null;
      this._renderCharacterList(contentEl);
      return;
    }

    const actions = ActionSystem.getAvailableActions(this.selectedNPCId);
    const recruitCheck = InfluenceSystem.canRecruit(this.selectedNPCId);

    let html = `
      <button class="back-btn" id="btn-back-to-list">← Back</button>
      <div class="character-detail">
        <div class="character-detail-header">
          <div class="character-detail-portrait" style="border-color: ${faction?.color || 'var(--glass-border)'}">${npc.portrait}</div>
          <div>
            <div class="character-detail-name" style="color: ${faction?.color || 'inherit'}">${npc.name}</div>
            <div class="character-detail-title">${npc.title}</div>
            <div style="margin-top: 6px; display: flex; gap: 6px;">
              <span class="character-faction-badge" style="background: rgba(${faction?.colorRgb || '255,255,255'}, 0.15); color: ${faction?.color || 'inherit'}">
                ${faction?.icon || ''} ${faction?.name || 'None'}
              </span>
              ${npc.recruited ? '<span class="character-recruited-badge">✓ Allied</span>' : ''}
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Relationship</div>
          <div class="relationship-bars" style="grid-template-columns: 1fr;">
            <div class="rel-bar">
              <span class="rel-bar-label" style="width: 70px; color: var(--color-trust);">Trust</span>
              <div class="rel-bar-track" style="height: 6px;"><div class="rel-bar-fill trust" style="width: ${rel.trust}%"></div></div>
              <span class="rel-bar-value">${rel.trust}</span>
            </div>
            <div class="rel-bar">
              <span class="rel-bar-label" style="width: 70px; color: var(--color-fear);">Fear</span>
              <div class="rel-bar-track" style="height: 6px;"><div class="rel-bar-fill fear" style="width: ${rel.fear}%"></div></div>
              <span class="rel-bar-value">${rel.fear}</span>
            </div>
            <div class="rel-bar">
              <span class="rel-bar-label" style="width: 70px; color: var(--color-respect);">Respect</span>
              <div class="rel-bar-track" style="height: 6px;"><div class="rel-bar-fill respect" style="width: ${rel.respect}%"></div></div>
              <span class="rel-bar-value">${rel.respect}</span>
            </div>
            <div class="rel-bar">
              <span class="rel-bar-label" style="width: 70px; color: var(--color-suspicion);">Suspicion</span>
              <div class="rel-bar-track" style="height: 6px;"><div class="rel-bar-fill suspicion" style="width: ${rel.suspicion}%"></div></div>
              <span class="rel-bar-value">${rel.suspicion}</span>
            </div>
          </div>
        </div>

        ${npc.discoveredSecrets.length > 0 ? `
          <div class="detail-section">
            <div class="detail-section-title">🔓 Known Secrets</div>
            <div style="font-size: 0.8rem; color: var(--color-danger); line-height: 1.5;">${charData.secrets}</div>
          </div>
        ` : ''}

        <div class="detail-section">
          <div class="detail-section-title">Actions</div>
          <div class="action-buttons">
            ${actions.filter(a => a.id !== 'spy').map(a => `
              <button class="action-btn" data-action="${a.id}" ${!a.available ? 'disabled' : ''} title="${a.description}">
                <span class="action-icon">${a.icon}</span>
                <span>${a.name}</span>
                ${a.cost ? `<span class="action-cost">${Object.entries(a.cost).map(([k,v]) => `${v} ${k}`).join(', ')}</span>` : ''}
              </button>
            `).join('')}
          </div>
          ${npc.recruited && !npc.spyMission ? `
            <div style="margin-top: 8px;">
              <button class="action-btn" data-action="spy" style="width: 100%;">
                <span class="action-icon">🕵️</span>
                <span>Send as Spy</span>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    contentEl.innerHTML = html;

    // Back button
    document.getElementById('btn-back-to-list')?.addEventListener('click', () => {
      this.selectedNPCId = null;
      this.render();
    });

    // Action buttons
    contentEl.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const actionId = btn.dataset.action;
        
        if (actionId === 'spy') {
          this._showSpyTargetModal();
          return;
        }

        // Open dialogue with this action
        eventBus.emit('npc:startDialogue', { 
          npcId: this.selectedNPCId,
          action: actionId 
        });
      });
    });
  }

  _renderFactionList(contentEl) {
    const state = gameState.getState();
    let html = '<div class="faction-list">';

    for (const [factionId, faction] of Object.entries(factions)) {
      const fState = state.factions[factionId];
      const summary = InfluenceSystem.getFactionSummary(factionId);

      html += `
        <div class="faction-card" style="--faction-color: ${faction.color};">
          <div class="faction-header">
            <div class="faction-name" style="--faction-color: ${faction.color}">
              ${faction.icon} ${faction.name}
            </div>
            <div class="faction-power">⚡ ${fState.power}</div>
          </div>
          <div class="faction-rank-badge">${fState.playerRank}</div>
          <div class="power-bar">
            <div class="power-bar-fill" style="width: ${fState.power}%; --faction-color: ${faction.color}"></div>
          </div>
          <div class="faction-stats" style="margin-top: 8px;">
            <div class="faction-stat">
              <span>Reputation</span>
              <span class="faction-stat-value" style="color: ${fState.playerReputation >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                ${fState.playerReputation >= 0 ? '+' : ''}${fState.playerReputation}
              </span>
            </div>
            <div class="faction-stat">
              <span>Influence</span>
              <span class="faction-stat-value">${fState.playerInfluence}</span>
            </div>
            <div class="faction-stat">
              <span>Allies</span>
              <span class="faction-stat-value">${summary?.recruited || 0}/${summary?.totalNPCs || 0}</span>
            </div>
            <div class="faction-stat">
              <span>Avg Trust</span>
              <span class="faction-stat-value">${summary?.avgTrust || 0}</span>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div>';
    contentEl.innerHTML = html;
  }

  _renderIntelBoard(contentEl) {
    const state = gameState.getState();
    const intel = state.intel;

    if (intel.length === 0) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">No intelligence gathered yet. Talk to people, recruit spies, and dig for secrets.</div>
        </div>
      `;
      return;
    }

    let html = '<div class="intel-list">';
    for (const item of intel.slice(0, 20)) {
      const faction = item.targetFaction ? factions[item.targetFaction] : null;
      html += `
        <div class="intel-item" style="border-left-color: ${faction?.color || 'var(--accent)'}">
          <div class="intel-source">
            ${item.type === 'spy_report' ? '🕵️ Spy Report' : '💬 Conversation'} 
            ${item.source ? `— ${item.source}` : ''}
          </div>
          <div class="intel-content">${item.content}</div>
          <div class="intel-day">Day ${item.day}</div>
        </div>
      `;
    }
    html += '</div>';
    contentEl.innerHTML = html;
  }

  _renderEventFeed(contentEl) {
    const state = gameState.getState();
    const events = state.eventLog;

    if (events.length === 0) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">No events yet. Keep playing and the world will react to your actions.</div>
        </div>
      `;
      return;
    }

    let html = '<div class="event-list">';
    for (const event of events.slice(0, 15)) {
      html += `
        <div class="event-item ${!event.resolved ? 'unresolved' : ''}">
          <span class="event-type-badge ${event.type}">${event.type}</span>
          <div class="event-title">${event.title}</div>
          <div class="event-description">${event.description}</div>
          ${!event.resolved && event.choices ? `
            <div class="event-choices">
              ${event.choices.map((choice, i) => `
                <button class="event-choice-btn" data-event-id="${event.id}" data-choice="${i}">
                  ${choice.text}
                </button>
              `).join('')}
            </div>
          ` : event.resolved ? `
            <div style="font-size: 0.72rem; color: var(--color-success); margin-top: 4px;">
              ✓ Resolved: ${event.choices?.[event.choiceIndex]?.text || 'Done'}
            </div>
          ` : ''}
          <div class="event-day">Day ${event.day}</div>
        </div>
      `;
    }
    html += '</div>';
    contentEl.innerHTML = html;

    // Event choice handlers
    contentEl.querySelectorAll('.event-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const eventId = btn.dataset.eventId;
        const choiceIndex = parseInt(btn.dataset.choice);
        
        // Apply event effects
        const state = gameState.getState();
        const event = state.eventLog.find(e => e.id === eventId);
        if (event) {
          // Import dynamically to avoid circular deps
          import('../../data/events.js').then(({ eventTemplates }) => {
            const template = eventTemplates.find(e => e.id === eventId);
            if (template) {
              InfluenceSystem.applyEventEffects(template, choiceIndex);
            }
            event.resolved = true;
            event.choiceIndex = choiceIndex;
            this.render();
            
            eventBus.emit('ui:notification', {
              type: 'info',
              message: `You chose: ${event.choices[choiceIndex].text}`,
              icon: '✅'
            });
          });
        }
      });
    });
  }

  _showSpyTargetModal() {
    const overlay = document.getElementById('modal-overlay');
    const npc = gameState.getState().npcs[this.selectedNPCId];
    
    overlay.classList.add('active');
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">Send ${npc.name} as Spy</div>
        <div class="modal-body">Choose a faction to infiltrate:</div>
        <div class="spy-target-list">
          ${Object.entries(factions)
            .filter(([id]) => id !== npc.faction)
            .map(([id, f]) => `
              <button class="spy-target-btn" data-faction="${id}">
                <span>${f.icon}</span>
                <span>${f.name}</span>
              </button>
            `).join('')}
        </div>
        <div class="modal-actions" style="margin-top: 16px;">
          <button class="btn btn-secondary btn-sm" id="btn-cancel-spy">Cancel</button>
        </div>
      </div>
    `;

    document.getElementById('btn-cancel-spy').addEventListener('click', () => {
      overlay.classList.remove('active');
    });

    overlay.querySelectorAll('.spy-target-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetFaction = btn.dataset.faction;
        ActionSystem.executeAction(this.selectedNPCId, 'spy', '', null, targetFaction);
        overlay.classList.remove('active');
        this.render();
      });
    });
  }

  _bindEvents() {
    eventBus.on('map:districtSelected', () => {
      this.activeTab = 'characters';
      this.selectedNPCId = null;
      this.render();
    });

    eventBus.on('npc:relationshipChanged', () => {
      if (this.activeTab === 'characters') this._renderTabContent();
    });

    eventBus.on('faction:standingChanged', () => {
      if (this.activeTab === 'factions') this._renderTabContent();
    });

    eventBus.on('intel:gained', () => {
      if (this.activeTab === 'intel') this._renderTabContent();
    });

    eventBus.on('event:fired', () => {
      if (this.activeTab === 'events') this._renderTabContent();
      // Show notification and switch to events tab
      this.activeTab = 'events';
      this.render();
    });

    eventBus.on('npc:recruited', () => {
      this.render();
    });

    eventBus.on('game:dayAdvanced', () => {
      this.render();
    });
  }
}

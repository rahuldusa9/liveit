/**
 * Notifications — Toast notification system
 */

import { eventBus } from '../../engine/EventBus.js';

const NOTIFICATION_DURATION = 4000;

export class Notifications {
  constructor() {
    this.container = document.getElementById('notifications-container');
    this._bindEvents();
  }

  _bindEvents() {
    eventBus.on('ui:notification', (data) => this.show(data));
  }

  show({ type = 'info', message, icon = 'ℹ️' }) {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.innerHTML = `
      <span class="notification-icon">${icon}</span>
      <span class="notification-message">${message}</span>
    `;

    el.addEventListener('click', () => this._dismiss(el));
    this.container.appendChild(el);

    // Auto dismiss
    setTimeout(() => this._dismiss(el), NOTIFICATION_DURATION);
  }

  _dismiss(el) {
    if (el.classList.contains('removing')) return;
    el.classList.add('removing');
    setTimeout(() => el.remove(), 300);
  }
}

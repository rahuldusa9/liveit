/**
 * App — Root application component
 * Manages screen transitions between Setup and Game
 */

import { eventBus } from '../engine/EventBus.js';
import { Notifications } from './components/Notifications.js';
import { SetupScreen } from './screens/SetupScreen.js';
import { GameScreen } from './screens/GameScreen.js';

export class App {
  constructor() {
    this.appEl = document.getElementById('app');
    this.currentScreen = null;

    // Initialize notifications (global)
    this.notifications = new Notifications();

    // Listen for screen changes
    eventBus.on('ui:screenChanged', ({ screen }) => {
      this.showScreen(screen);
    });

    // Start with setup screen
    this.showScreen('setup');
  }

  showScreen(screenName) {
    // Clear current screen
    this.appEl.innerHTML = '';

    switch (screenName) {
      case 'setup':
        this.currentScreen = new SetupScreen(this.appEl);
        break;
      case 'game':
        this.currentScreen = new GameScreen(this.appEl);
        break;
      default:
        console.error(`Unknown screen: ${screenName}`);
    }
  }
}

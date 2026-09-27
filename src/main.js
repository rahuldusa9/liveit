/**
 * LiveIt — Main Entry Point
 * AI-Powered Political Strategy Game
 * 
 * Rise from nobody to supreme leader through
 * manipulation, espionage, and diplomacy.
 */

import './styles/main.css';

// Import systems to register their event listeners
import './systems/EventGenerator.js';

// Import and start the app
import { App } from './ui/App.js';

// Wait for DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  console.log('%c⚔️ LiveIt — Rise to Power', 'font-size: 20px; font-weight: bold; color: #00E5FF;');
  console.log('%cEvery character is an AI. Every choice matters.', 'color: #8892A6;');
});

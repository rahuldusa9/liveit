/**
 * ConversationMemory — Manages conversation history per NPC.
 * Handles context window limits by summarizing old conversations.
 */

const MAX_MESSAGES_PER_NPC = 30; // Keep last N messages in full detail
const SUMMARY_THRESHOLD = 20;    // Summarize when exceeding this count

export class ConversationMemory {
  constructor() {
    this.conversations = {}; // { npcId: Message[] }
    this.summaries = {};     // { npcId: string } - compressed older conversations
  }

  /**
   * Initialize from saved game state
   */
  loadFromState(conversationData, summaryData) {
    this.conversations = conversationData || {};
    this.summaries = summaryData || {};
  }

  /**
   * Get the full message array for an NPC, including summary context
   */
  getMessages(npcId) {
    const messages = this.conversations[npcId] || [];
    const summary = this.summaries[npcId];

    if (summary && messages.length > 0) {
      // Prepend summary as a system message for context
      return [
        { role: 'system', content: `[Previous conversation summary: ${summary}]` },
        ...messages
      ];
    }

    return [...messages];
  }

  /**
   * Add a message to an NPC's conversation history
   */
  addMessage(npcId, role, content) {
    if (!this.conversations[npcId]) {
      this.conversations[npcId] = [];
    }

    this.conversations[npcId].push({
      role,
      content,
      timestamp: Date.now()
    });

    // Trim if needed
    if (this.conversations[npcId].length > MAX_MESSAGES_PER_NPC) {
      this._compressHistory(npcId);
    }
  }

  /**
   * Get the last N messages for an NPC
   */
  getRecentMessages(npcId, count = 10) {
    const messages = this.conversations[npcId] || [];
    return messages.slice(-count);
  }

  /**
   * Check if player has talked to this NPC before
   */
  hasHistory(npcId) {
    return (this.conversations[npcId]?.length || 0) > 0;
  }

  /**
   * Get conversation count for an NPC
   */
  getMessageCount(npcId) {
    return this.conversations[npcId]?.length || 0;
  }

  /**
   * Clear history for an NPC
   */
  clearHistory(npcId) {
    delete this.conversations[npcId];
    delete this.summaries[npcId];
  }

  /**
   * Export state for saving
   */
  exportState() {
    return {
      conversations: this.conversations,
      summaries: this.summaries
    };
  }

  /**
   * Compress older messages into a summary to stay within context limits
   */
  _compressHistory(npcId) {
    const messages = this.conversations[npcId];
    if (messages.length <= SUMMARY_THRESHOLD) return;

    // Take the older half and create a summary
    const cutPoint = messages.length - SUMMARY_THRESHOLD;
    const oldMessages = messages.slice(0, cutPoint);
    
    // Build a condensed summary from old messages
    const summary = this._buildSummary(oldMessages, this.summaries[npcId]);
    this.summaries[npcId] = summary;
    
    // Keep only recent messages
    this.conversations[npcId] = messages.slice(cutPoint);
  }

  /**
   * Build a text summary from a set of messages
   */
  _buildSummary(messages, existingSummary = '') {
    const topics = [];
    
    for (const msg of messages) {
      if (msg.role === 'user') {
        // Extract key topics from player messages
        const content = msg.content.toLowerCase();
        if (content.includes('secret') || content.includes('tell me')) topics.push('asked about secrets');
        if (content.includes('threat') || content.includes('warn')) topics.push('made threats');
        if (content.includes('help') || content.includes('ally')) topics.push('offered help/alliance');
        if (content.includes('money') || content.includes('pay')) topics.push('discussed money');
        if (content.includes('trust')) topics.push('discussed trust');
      }
    }

    const newSummary = `Past conversations covered: ${[...new Set(topics)].join(', ') || 'general conversation'}. ${messages.length} messages exchanged.`;
    
    if (existingSummary) {
      return `${existingSummary} Additionally: ${newSummary}`;
    }
    return newSummary;
  }
}

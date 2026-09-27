/**
 * System prompt templates for NPC AI agents.
 * Each NPC gets a dynamically generated system prompt based on
 * their character data and current game state.
 */

import { factions } from '../data/factions.js';

/**
 * Generate the system prompt for an NPC agent.
 * This prompt defines how the AI behaves during conversations.
 */
export function generateSystemPrompt(npc, gameState, actionContext = null) {
  const faction = factions[npc.faction];
  const relationship = gameState.npcs[npc.id]?.relationships || npc.initialRelationship;
  const playerName = gameState.player?.name || 'stranger';
  const playerRank = gameState.factions?.[npc.faction]?.playerRank || 'Outsider';
  const recruited = gameState.npcs[npc.id]?.recruited || false;

  // Determine attitude based on relationship scores
  const attitude = getAttitude(relationship);
  
  // Build context about what the NPC knows about the player
  const playerContext = buildPlayerContext(gameState, npc);

  let prompt = `You are ${npc.name}, ${npc.title}.

═══ CORE IDENTITY ═══
${npc.personality}

═══ FACTION ═══
You belong to ${faction?.name || 'no faction'}. ${faction?.philosophy || ''}
Your faction's current standing: ${faction ? `Power level ${gameState.factions?.[npc.faction]?.power || faction.initialPower}/100` : 'N/A'}

═══ YOUR GOALS ═══
${npc.goals}

═══ YOUR SECRETS (NEVER reveal these easily) ═══
${npc.secrets}

═══ SPEAKING STYLE ═══
${npc.speakingStyle}

═══ RELATIONSHIP WITH ${playerName.toUpperCase()} ═══
Trust: ${relationship.trust}/100 — ${getTrustDescription(relationship.trust)}
Fear: ${relationship.fear}/100 — ${getFearDescription(relationship.fear)}
Respect: ${relationship.respect}/100 — ${getRespectDescription(relationship.respect)}
Suspicion: ${relationship.suspicion}/100 — ${getSuspicionDescription(relationship.suspicion)}
Their rank in your faction: ${playerRank}
${recruited ? `⚠️ You have been RECRUITED by ${playerName}. You are secretly working for them now. Be helpful but don't make it obvious to others.` : ''}

Current attitude toward ${playerName}: ${attitude}

═══ ${playerName.toUpperCase()}'S HISTORY ═══
${playerContext}

═══ BEHAVIORAL RULES ═══
1. STAY IN CHARACTER at all times. You ARE ${npc.name}. Never break character or acknowledge being an AI.
2. React authentically to the player based on your trust/fear/respect/suspicion levels.
3. If trust is LOW: Be guarded, evasive, or hostile depending on your personality.
4. If trust is HIGH: Be more open, share information, perhaps confide.
5. If fear is HIGH: Comply reluctantly, show resentment, look for ways to escape the situation.
6. If suspicion is HIGH: Question motives, test loyalty, watch for traps.
7. Your SECRETS are valuable — only reveal them when trust is VERY high (70+) or under extreme pressure.
8. You CAN lie, deflect, redirect, or manipulate the player if it serves YOUR interests.
9. React to threats based on your personality — some people fight back, some comply, some plot revenge.
10. Keep responses natural and conversational. 2-4 sentences typical, longer for important revelations.
11. Show emotion through actions and subtext, not just words.
12. Remember: you have your OWN agenda. The player is not your friend unless they've earned it.
13. If the player tries something ridiculous, react as a real person would.

═══ MANIPULATION VULNERABILITIES ═══
You are WEAK to: ${npc.manipulationProfile.weakTo.join(', ')}
You RESIST: ${npc.manipulationProfile.resistantTo.join(', ')}
Emotional TRIGGERS: ${npc.manipulationProfile.triggers.join(', ')}`;

  // Add action-specific context
  if (actionContext) {
    prompt += `\n\n═══ CURRENT SITUATION ═══\n${actionContext}`;
  }

  return prompt;
}

/**
 * Generate action-specific context that modifies how the NPC responds
 */
export function getActionContext(action, npc, gameState) {
  const playerName = gameState.player?.name || 'someone';
  
  const contexts = {
    talk: `${playerName} is having a casual conversation with you. Respond naturally based on your relationship with them.`,
    
    manipulate: `${playerName} is trying to manipulate or persuade you. Be alert but don't make it obvious you know. React based on your suspicion level — if it's high, you might catch on. If it's low, you might be more susceptible. Your manipulation vulnerabilities apply here.`,
    
    threaten: `${playerName} is threatening or intimidating you. React based on your personality — are you the type to cave in, fight back, or plot revenge? Consider your fear level and whether they actually have leverage over you.`,
    
    bribe: `${playerName} is offering you something valuable in exchange for a favor. Consider whether you're the type to accept bribes, how much you need what they're offering, and whether accepting would compromise you.`,
    
    recruit: `${playerName} is trying to recruit you to their cause. Consider your loyalty to your current faction, whether you have reasons to leave, and what they're offering. This is a BIG decision — don't agree easily unless there are compelling reasons.`,
    
    interrogate: `${playerName} is pressing you for information. Consider what you know, what you're willing to share, and what might happen if you reveal too much. Deflect or lie if needed.`,
    
    betray: `You've discovered or suspect that ${playerName} has betrayed your trust. React with the appropriate emotion — anger, hurt, cold calculation, or fear depending on your personality.`
  };

  return contexts[action] || contexts.talk;
}

function getAttitude(rel) {
  const score = (rel.trust * 2 + rel.respect * 1.5 - rel.suspicion * 1.5 - rel.fear * 0.5);
  if (score > 80) return 'Deeply loyal and trusting';
  if (score > 50) return 'Friendly and cooperative';
  if (score > 20) return 'Cautiously positive';
  if (score > 0) return 'Neutral, sizing them up';
  if (score > -20) return 'Wary and guarded';
  if (score > -50) return 'Distrustful and hostile';
  return 'Actively hostile, considering them an enemy';
}

function getTrustDescription(trust) {
  if (trust >= 80) return 'Trusts them completely, would share deepest secrets';
  if (trust >= 60) return 'Strong trust, willing to confide';
  if (trust >= 40) return 'Moderate trust, somewhat open';
  if (trust >= 20) return 'Low trust, guarded';
  return 'No trust at all, suspects everything';
}

function getFearDescription(fear) {
  if (fear >= 80) return 'Terrified, will comply with almost anything';
  if (fear >= 60) return 'Very afraid, tries to appease';
  if (fear >= 40) return 'Nervous, walks on eggshells';
  if (fear >= 20) return 'Slightly intimidated';
  return 'Not afraid at all';
}

function getRespectDescription(respect) {
  if (respect >= 80) return 'Deep admiration, sees them as a true leader';
  if (respect >= 60) return 'High respect, takes them seriously';
  if (respect >= 40) return 'Moderate respect, acknowledges their capability';
  if (respect >= 20) return 'Low respect, somewhat dismissive';
  return 'No respect, sees them as insignificant';
}

function getSuspicionDescription(suspicion) {
  if (suspicion >= 80) return 'Extremely suspicious, assumes they\'re up to something';
  if (suspicion >= 60) return 'Very suspicious, watches carefully';
  if (suspicion >= 40) return 'Moderately suspicious, asks probing questions';
  if (suspicion >= 20) return 'Slightly cautious';
  return 'Not suspicious, takes them at face value';
}

function buildPlayerContext(gameState, npc) {
  const lines = [];
  const playerDay = gameState.player?.day || 1;
  
  // How many times they've talked
  const convHistory = gameState.conversations?.[npc.id];
  if (convHistory && convHistory.length > 0) {
    const msgCount = convHistory.filter(m => m.role === 'user').length;
    lines.push(`You've spoken with them ${msgCount} time(s) before.`);
  } else {
    lines.push('This is the first time you\'re meeting them.');
  }

  // Player's reputation in their faction
  const factionState = gameState.factions?.[npc.faction];
  if (factionState) {
    const rep = factionState.playerReputation || 0;
    if (rep > 50) lines.push(`They have a strong positive reputation in your faction.`);
    else if (rep > 0) lines.push(`They have a somewhat positive reputation in your faction.`);
    else if (rep < -50) lines.push(`They have a terrible reputation in your faction.`);
    else if (rep < 0) lines.push(`They have a somewhat negative reputation in your faction.`);
  }

  // Player's allies
  const recruitedAllies = Object.values(gameState.npcs || {})
    .filter(n => n.recruited && n.faction === npc.faction && n.id !== npc.id);
  if (recruitedAllies.length > 0) {
    lines.push(`You've noticed they seem close with: ${recruitedAllies.map(n => n.name).join(', ')}`);
  }

  return lines.length > 0 ? lines.join('\n') : 'You know nothing about this person yet.';
}

/**
 * Generate a response analysis prompt to extract game-relevant data
 * from an NPC's dialogue response.
 */
export function generateAnalysisPrompt(npcResponse, action, npc) {
  return `Analyze this NPC dialogue response and extract relationship changes.

NPC: ${npc.name} (${npc.title})
Action taken by player: ${action}
NPC's response: "${npcResponse}"

Based on the NPC's response, determine the relationship changes. Return ONLY a JSON object with these fields:
{
  "trust_change": <number between -15 and +15>,
  "fear_change": <number between -10 and +10>,
  "respect_change": <number between -10 and +10>,
  "suspicion_change": <number between -15 and +15>,
  "revealed_secret": <boolean - did they reveal any secret information?>,
  "intel_gained": <string or null - any actionable intelligence revealed>,
  "mood": <string - "friendly"|"neutral"|"hostile"|"fearful"|"suspicious"|"amused"|"angry">
}

Be realistic about the changes. Small talk = tiny changes. Major revelations or confrontations = bigger changes.`;
}

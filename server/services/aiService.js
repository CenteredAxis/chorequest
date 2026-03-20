'use strict';

const crypto = require('crypto');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://10.0.0.168:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

async function callOllama(prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();
    return data.response.trim();
  } finally {
    clearTimeout(timeout);
  }
}

function choreHash(title, description) {
  return crypto.createHash('md5').update(`${title}|${description || ''}`).digest('hex');
}

async function generateNarrative(db, chore) {
  const hash = choreHash(chore.title, chore.description);

  const cached = db.prepare(
    'SELECT narrative FROM chore_narratives WHERE chore_id = ? AND chore_hash = ?'
  ).get(chore.id, hash);

  if (cached) return cached.narrative;

  const prompt = `You are a fun quest narrator for a kids chore app called ChoreQuest. Turn this chore into an exciting 1-2 sentence adventure quest description that would motivate a child. Be creative, playful, and encouraging. Do not use any markdown formatting.

Chore: ${chore.title}
Details: ${chore.description || 'No details provided'}

Quest narrative:`;

  const narrative = await callOllama(prompt);

  db.prepare(`
    INSERT INTO chore_narratives (chore_id, narrative, chore_hash)
    VALUES (?, ?, ?)
    ON CONFLICT(chore_id) DO UPDATE SET narrative = excluded.narrative, chore_hash = excluded.chore_hash, generated_at = CURRENT_TIMESTAMP
  `).run(chore.id, narrative, hash);

  return narrative;
}

async function getNarrativesForChores(db, chores) {
  const narratives = {};
  for (const chore of chores) {
    try {
      narratives[chore.id] = await generateNarrative(db, chore);
    } catch (err) {
      console.error(`Failed to generate narrative for chore ${chore.id}:`, err.message);
      narratives[chore.id] = null;
    }
  }
  return narratives;
}

async function suggestChores(db, parentId) {
  const existingChores = db.prepare(
    'SELECT title, description FROM chores WHERE parent_id = ?'
  ).all(parentId);

  const kids = db.prepare(
    'SELECT name, level FROM kids WHERE parent_id = ? AND is_active = 1'
  ).all(parentId);

  const choreList = existingChores.map(c => `- ${c.title}`).join('\n') || 'None yet';
  const kidList = kids.map(k => `${k.name} (level ${k.level})`).join(', ') || 'No kids added';

  const prompt = `You are a helpful assistant for a family chore app. Suggest 5 new age-appropriate chores that are different from the existing ones.

Existing chores:
${choreList}

Kids: ${kidList}

Return ONLY a JSON array of objects with these fields: title (string), description (string), coin_reward (number 5-50), xp_reward (number 25-200). No other text, just the JSON array.`;

  const response = await callOllama(prompt);

  // Try to parse JSON, with fallback regex extraction
  try {
    return JSON.parse(response);
  } catch {
    const match = response.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse AI suggestions');
  }
}

module.exports = { getNarrativesForChores, suggestChores };

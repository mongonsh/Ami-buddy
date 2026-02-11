const BASE_URL = 'https://api.memu.so';

export async function memorizeConversation({ apiKey, userId, agentId, conversation }) {
  const res = await fetch(`${BASE_URL}/api/v3/memory/memorize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ conversation, user_id: userId, agent_id: agentId })
  });
  return res.json();
}

export async function getMemorizeStatus({ apiKey, taskId }) {
  const res = await fetch(`${BASE_URL}/api/v3/memory/memorize/status/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  return res.json();
}

export async function retrieveMemories({ apiKey, userId, agentId, query }) {
  const res = await fetch(`${BASE_URL}/api/v3/memory/retrieve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: userId, agent_id: agentId, query })
  });
  return res.json();
}

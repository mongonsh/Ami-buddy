import Constants from 'expo-constants';

const BASE_URL = 'https://api.memu.so';

interface MemorizeParams {
  conversation: Array<{ role: string; content: string }>;
  userId?: string;
  agentId?: string;
}

interface RetrieveParams {
  query: string;
  userId?: string;
  agentId?: string;
}

// Get MemU credentials from environment
function getMemUConfig() {
  const apiKey = Constants.expoConfig?.extra?.MEMU_API_KEY;
  const userId = Constants.expoConfig?.extra?.MEMU_USER_ID || 'default_user';
  const agentId = Constants.expoConfig?.extra?.MEMU_AGENT_ID || 'amibuddy_agent';
  
  return { apiKey, userId, agentId };
}

// Store homework session memory
export async function memorizeHomeworkSession(params: {
  characterName: string;
  homeworkDescription: string;
  topics: string[];
  difficulty: string;
  imageUri: string;
}) {
  try {
    const { apiKey, userId, agentId } = getMemUConfig();
    
    if (!apiKey) {
      console.warn('MemU API key not found, skipping memorization');
      return null;
    }

    const conversation = [
      {
        role: 'system',
        content: `Character: ${params.characterName}`
      },
      {
        role: 'user',
        content: `宿題セッション開始`
      },
      {
        role: 'assistant',
        content: `宿題の内容: ${params.homeworkDescription}`
      },
      {
        role: 'assistant',
        content: `トピック: ${params.topics.join(', ')}`
      },
      {
        role: 'assistant',
        content: `難易度: ${params.difficulty}`
      },
      {
        role: 'assistant',
        content: `日時: ${new Date().toLocaleString('ja-JP')}`
      }
    ];

    const response = await fetch(`${BASE_URL}/api/v3/memory/memorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation,
        user_id: userId,
        agent_id: agentId
      })
    });

    if (!response.ok) {
      if (response.status === 402) {
        return null;
      }
      console.error('MemU memorize error:', response.status);
      return null;
    }
    const data = await response.json();
    console.log('MemU memorized homework session:', data);
    return data;
  } catch (error) {
    console.error('MemU memorize error:', error);
    return null;
  }
}

// Store conversation memory
export async function memorizeConversation(params: {
  characterName: string;
  question: string;
  answer: string;
  homeworkContext?: string;
}) {
  try {
    const { apiKey, userId, agentId } = getMemUConfig();
    
    if (!apiKey) {
      console.warn('MemU API key not found, skipping memorization');
      return null;
    }

    const conversation = [
      {
        role: 'system',
        content: `Character: ${params.characterName}`
      }
    ];

    if (params.homeworkContext) {
      conversation.push({
        role: 'system',
        content: `宿題コンテキスト: ${params.homeworkContext}`
      });
    }

    conversation.push(
      {
        role: 'user',
        content: params.question
      },
      {
        role: 'assistant',
        content: params.answer
      },
      {
        role: 'system',
        content: `日時: ${new Date().toLocaleString('ja-JP')}`
      }
    );

    const response = await fetch(`${BASE_URL}/api/v3/memory/memorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation,
        user_id: userId,
        agent_id: agentId
      })
    });

    if (!response.ok) {
      if (response.status === 402) {
        // Payment required - silently skip
        return null;
      }
      console.error('MemU memorize error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('MemU memorized conversation:', data);
    return data;
  } catch (error) {
    console.error('MemU memorize error:', error);
    return null;
  }
}

// Store character creation memory
export async function memorizeCharacterCreation(params: {
  characterName: string;
  drawingImageUri: string;
  createdAt: Date;
}) {
  try {
    const { apiKey, userId, agentId } = getMemUConfig();
    
    if (!apiKey) {
      console.warn('MemU API key not found, skipping memorization');
      return null;
    }

    const conversation = [
      {
        role: 'user',
        content: `新しいキャラクターを作成しました`
      },
      {
        role: 'assistant',
        content: `キャラクター名: ${params.characterName}`
      },
      {
        role: 'assistant',
        content: `作成日時: ${params.createdAt.toLocaleString('ja-JP')}`
      },
      {
        role: 'assistant',
        content: `こんにちは、わたしは ${params.characterName} です。よろしくね！`
      }
    ];

    const response = await fetch(`${BASE_URL}/api/v3/memory/memorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation,
        user_id: userId,
        agent_id: agentId
      })
    });

    if (!response.ok) {
      if (response.status === 402) {
        // Payment required - silently skip
        return null;
      }
      console.error('MemU memorize error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('MemU memorized character creation:', data);
    return data;
  } catch (error) {
    console.error('MemU memorize error:', error);
    return null;
  }
}

// Retrieve relevant memories
export async function retrieveMemories(query: string): Promise<any[]> {
  try {
    const { apiKey, userId, agentId } = getMemUConfig();
    
    if (!apiKey) {
      console.warn('MemU API key not found, returning empty memories');
      return [];
    }

    const response = await fetch(`${BASE_URL}/api/v3/memory/retrieve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        user_id: userId,
        agent_id: agentId
      })
    });

    if (!response.ok) {
      if (response.status === 402) {
        // Payment required - silently skip
        return [];
      }
      console.error('MemU retrieve error:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('MemU retrieved memories:', data);
    return data.memories || [];
  } catch (error) {
    console.error('MemU retrieve error:', error);
    return [];
  }
}

// Get memorization status
export async function getMemorizeStatus(taskId: string) {
  try {
    const { apiKey } = getMemUConfig();
    
    if (!apiKey) {
      return null;
    }

    const response = await fetch(`${BASE_URL}/api/v3/memory/memorize/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      if (response.status === 402) {
        // Payment required - silently skip
        return null;
      }
      console.error('MemU status error:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('MemU status error:', error);
    return null;
  }
}

// Get learning summary
export async function getLearningSummary(): Promise<string> {
  try {
    const memories = await retrieveMemories('宿題セッション 学習 進捗');
    
    if (memories.length === 0) {
      return 'まだ宿題の記録がありません。';
    }

    // Analyze memories to create summary
    const sessionCount = memories.filter((m: any) => 
      m.content?.includes('宿題セッション')
    ).length;

    const topics = new Set<string>();
    memories.forEach((m: any) => {
      if (m.content?.includes('トピック:')) {
        const topicMatch = m.content.match(/トピック: (.+)/);
        if (topicMatch) {
          topicMatch[1].split(',').forEach((t: string) => topics.add(t.trim()));
        }
      }
    });

    return `これまでに ${sessionCount} 回の宿題セッションを完了しました。学習したトピック: ${Array.from(topics).join(', ')}`;
  } catch (error) {
    console.error('Learning summary error:', error);
    return '学習サマリーを取得できませんでした。';
  }
}

import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiResponse {
  description: string;
  topics: string[];
  difficulty: string;
}

interface ReviewResponse {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  sticker: string;
}

function inferMimeType(uri: string, fallback: string) {
  const lowerUri = uri.toLowerCase();
  if (lowerUri.startsWith('data:')) {
    const match = lowerUri.match(/^data:([^;]+);base64,/);
    if (match?.[1]) return match[1];
  }
  if (lowerUri.endsWith('.png') || lowerUri.includes('.png')) return 'image/png';
  if (lowerUri.endsWith('.gif') || lowerUri.includes('.gif')) return 'image/gif';
  if (lowerUri.endsWith('.webp') || lowerUri.includes('.webp')) return 'image/webp';
  if (lowerUri.endsWith('.jpg') || lowerUri.endsWith('.jpeg') || lowerUri.includes('.jpg') || lowerUri.includes('.jpeg')) {
    return 'image/jpeg';
  }
  return fallback;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function getBase64FromUri(uri: string): Promise<{ base64: string; mimeType: string }> {
  try {
    // Determine MIME type
    let mimeType = inferMimeType(uri, 'image/jpeg');

    // Handle data URIs directly
    if (uri.startsWith('data:')) {
      const match = uri.match(/^data:([^;]+);base64,(.*)$/);
      if (!match) {
        throw new Error('Invalid data URI');
      }
      const dataMime = match[1] || mimeType;
      return { base64: match[2], mimeType: dataMime };
    }

    // Check if it's an asset URI (starts with 'asset://' or contains '/assets/')
    if (uri.startsWith('asset://') || uri.includes('/assets/') || uri.startsWith('file:///assets')) {
      // For bundled assets, we need to use fetch
      const response = await fetch(uri);
      const blob = await response.blob();
      if (blob.type) mimeType = blob.type;
      const base64 = await blobToBase64(blob);
      return { base64, mimeType };
    } else {
      // On web (or blob/http URIs), use fetch + FileReader
      if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('http://') || uri.startsWith('https://')) {
        const response = await fetch(uri);
        const blob = await response.blob();
        if (blob.type) mimeType = blob.type;
        const base64 = await blobToBase64(blob);
        return { base64, mimeType };
      }

      // For regular file URIs on native, use FileSystem
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return { base64, mimeType };
    }
  } catch (error) {
    console.error('Error reading image:', error);
    throw error;
  }
}

export async function analyzeHomeworkWithGemini(imageUri: string): Promise<GeminiResponse> {
  try {
    const apiKey = Constants.expoConfig?.extra?.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }

    // Get base64 and MIME type
    const { base64, mimeType } = await getBase64FromUri(imageUri);

    const prompt = `この宿題の画像を分析して、以下のJSON形式で返してください：

{
  "description": "宿題の内容を子供向けに2文で説明",
  "topics": ["トピック1", "トピック2"],
  "difficulty": "かんたん"
}

JSONのみを返してください。説明文は含めないでください。`;

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
        maxOutputTokens: 2048
      }
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini response text:', text);
    
    // Clean up markdown if present
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, '');
    cleanText = cleanText.replace(/```\s*/g, '');
    cleanText = cleanText.trim();
    
    // Try to fix incomplete JSON
    if (cleanText && !cleanText.endsWith('}')) {
      const openBraces = (cleanText.match(/{/g) || []).length;
      const closeBraces = (cleanText.match(/}/g) || []).length;
      const missingBraces = openBraces - closeBraces;
      
      if (missingBraces > 0) {
        console.log(`Adding ${missingBraces} missing closing braces`);
        cleanText += '}'.repeat(missingBraces);
      }
    }
    
    console.log('Cleaned text:', cleanText);
    
    try {
      const parsed = JSON.parse(cleanText);
      
      // Validate required fields
      if (!parsed.description) {
        parsed.description = 'この宿題を見ました。がんばってね！';
      }
      if (!parsed.topics || !Array.isArray(parsed.topics)) {
        parsed.topics = ['宿題'];
      }
      if (!parsed.difficulty) {
        parsed.difficulty = 'ふつう';
      }
      
      return parsed;
    } catch (e) {
      console.error('JSON parse error:', e);
      
      // Try to extract fields manually
      const descMatch = cleanText.match(/"description"\s*:\s*"([^"]+)"/);
      const topicsMatch = cleanText.match(/"topics"\s*:\s*\[(.*?)\]/);
      const difficultyMatch = cleanText.match(/"difficulty"\s*:\s*"([^"]+)"/);
      
      const description = descMatch ? descMatch[1] : 'この宿題を見ました。がんばってね！';
      const topicsStr = topicsMatch ? topicsMatch[1] : '';
      const topics = topicsStr ? topicsStr.split(',').map(t => t.replace(/"/g, '').trim()).filter(Boolean) : ['宿題'];
      const difficulty = difficultyMatch ? difficultyMatch[1] : 'ふつう';
      
      return {
        description,
        topics,
        difficulty
      };
    }
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw error;
  }
}

export async function reviewHomeworkWithGemini(imageUri: string, originalHomework: string): Promise<ReviewResponse> {
  try {
    const apiKey = Constants.expoConfig?.extra?.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }

    // Get base64 and MIME type
    const { base64, mimeType } = await getBase64FromUri(imageUri);

    const prompt = `この完成した宿題の画像をレビューしてください。

元の宿題: ${originalHomework}

以下のJSON形式で返してください：

{
  "score": 85,
  "feedback": "よくできました！きれいにかけていますね。",
  "strengths": ["きれいな字", "正確な答え"],
  "improvements": ["もう少し大きく書こう"],
  "sticker": "🌟"
}

スコアは0-100で評価してください。
stickerは以下から選んでください: 🌟, ⭐, 🎉, 🏆, 💯, 👏, 🎊, ✨, 🌈, 💪

JSONのみを返してください。説明文は含めないでください。`;

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.6,
        maxOutputTokens: 2048
      }
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini review response:', text);
    
    // Clean up markdown if present
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, '');
    cleanText = cleanText.replace(/```\s*/g, '');
    cleanText = cleanText.trim();
    
    // Try to fix incomplete JSON
    if (cleanText && !cleanText.endsWith('}')) {
      const openBraces = (cleanText.match(/{/g) || []).length;
      const closeBraces = (cleanText.match(/}/g) || []).length;
      const missingBraces = openBraces - closeBraces;
      
      if (missingBraces > 0) {
        cleanText += '}'.repeat(missingBraces);
      }
    }
    
    try {
      const parsed = JSON.parse(cleanText);
      
      // Validate required fields
      if (typeof parsed.score !== 'number') {
        parsed.score = 80;
      }
      if (!parsed.feedback) {
        parsed.feedback = 'よくがんばりました！';
      }
      if (!parsed.strengths || !Array.isArray(parsed.strengths)) {
        parsed.strengths = ['がんばった'];
      }
      if (!parsed.improvements || !Array.isArray(parsed.improvements)) {
        parsed.improvements = ['このちょうしでがんばろう'];
      }
      if (!parsed.sticker) {
        parsed.sticker = parsed.score >= 90 ? '🌟' : parsed.score >= 70 ? '⭐' : '👏';
      }
      
      return parsed;
    } catch (e) {
      console.error('JSON parse error:', e);
      
      // Return default review
      return {
        score: 80,
        feedback: 'よくがんばりました！すばらしいです！',
        strengths: ['がんばった', 'よくできた'],
        improvements: ['このちょうしでがんばろう'],
        sticker: '⭐'
      };
    }
  } catch (error) {
    console.error('Gemini review error:', error);
    throw error;
  }
}

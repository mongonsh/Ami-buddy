import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { playJapaneseVoice, configureAudio } from './elevenLabsService';
import { GoogleGenerativeAI } from '@google/generative-ai';

const isWeb = Platform.OS === 'web';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Convert audio to text using Google Generative AI SDK
export async function transcribeAudioWithGemini(audioUri: string): Promise<string> {
  try {
    const apiKey = Constants.expoConfig?.extra?.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('No Gemini API key, using placeholder');
      return 'この問題はどうやって解きますか？';
    }

    console.log('Transcribing audio with Gemini SDK...');

    let audioData: string;
    
    if (isWeb) {
      // Web: Convert blob URL to base64
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      audioData = btoa(String.fromCharCode(...bytes));
    } else {
      // Mobile: Read from file system
      audioData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      '音声を聞いて、日本語で文字起こししてください。質問の内容だけを返してください。説明は不要です。',
      {
        inlineData: {
          mimeType: isWeb ? 'audio/webm' : 'audio/mp4',
          data: audioData
        }
      }
    ]);

    const response = await result.response;
    const transcript = response.text().trim();
    
    if (transcript) {
      console.log('Gemini transcribed:', transcript);
      return transcript;
    }
    
    console.warn('No transcript from Gemini, using placeholder');
    return 'この問題はどうやって解きますか？';
  } catch (error) {
    console.error('Gemini transcription error:', error);
    return 'この問題はどうやって解きますか？';
  }
}

// Get AI response using Google Generative AI SDK
export async function getConversationResponse(
  question: string,
  homeworkContext: string,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  try {
    const apiKey = Constants.expoConfig?.extra?.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build conversation context
    const contextPrompt = `あなたは子供の宿題を手伝う優しい先生です。
宿題の内容: ${homeworkContext}

子供の質問に対して、わかりやすく、優しく答えてください。
答えは2-3文で簡潔にしてください。`;

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: contextPrompt }]
        },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
          parts: [{ text: msg.content }]
        }))
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      }
    });

    const result = await chat.sendMessage(question);
    const response = await result.response;
    const answer = response.text().trim() || 'ごめんね、わかりませんでした。';
    
    return answer;
  } catch (error) {
    console.error('Conversation error:', error);
    throw error;
  }
}

// Record audio from microphone
export async function startRecording(): Promise<Audio.Recording> {
  try {
    await configureAudio();
    
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission not granted');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    });

    await recording.startAsync();
    return recording;
  } catch (error) {
    console.error('Recording start error:', error);
    throw error;
  }
}

// Stop recording and get URI
export async function stopRecording(recording: Audio.Recording): Promise<string> {
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    return uri || '';
  } catch (error) {
    console.error('Recording stop error:', error);
    throw error;
  }
}

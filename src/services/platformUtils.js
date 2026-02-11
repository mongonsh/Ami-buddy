import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

export function getWebAudioContext() {
  if (!isWeb) return null;
  return new (window.AudioContext || window.webkitAudioContext)();
}

export async function playAudioFromBase64Web(base64Audio) {
  if (!isWeb) return;
  
  try {
    const audioContext = getWebAudioContext();
    if (!audioContext) {
      throw new Error('Web Audio API not supported');
    }

    // Convert base64 to array buffer
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode and play
    const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);

    return new Promise((resolve) => {
      source.onended = resolve;
    });
  } catch (error) {
    console.error('Web audio playback error:', error);
    throw error;
  }
}

export async function playAudioFromUrlWeb(url) {
  if (!isWeb) return;
  
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = resolve;
    audio.onerror = reject;
    audio.play().catch(reject);
  });
}

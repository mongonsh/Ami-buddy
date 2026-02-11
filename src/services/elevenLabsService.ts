import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export async function configureAudio() {
  if (isWeb) {
    // Web doesn't need audio configuration
    return;
  }
  
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false
  });
}

export async function playJapaneseVoice(text: string, apiKey?: string, voiceId?: string) {
  // Get API keys from environment or use provided ones
  const key = apiKey || Constants.expoConfig?.extra?.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
  const voice = voiceId || Constants.expoConfig?.extra?.ELEVENLABS_VOICE_ID || process.env.ELEVENLABS_VOICE_ID;
  
  if (!key || !voice) {
    console.error('Missing ElevenLabs credentials');
    throw new Error('音声サービスの設定が見つかりません');
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': key,
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('TTS request failed:', res.status, errText);
      throw new Error(`音声の生成に失敗しました: ${res.status}`);
    }
    
    // Web version - use HTML5 Audio
    if (isWeb) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      return new Promise((resolve, reject) => {
        try {
          const audio = new (window.Audio || Audio)(url);
          
          // Handle autoplay policy
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Autoplay started successfully
                audio.onended = () => {
                  URL.revokeObjectURL(url);
                  resolve(null);
                };
              })
              .catch((error) => {
                // Autoplay was prevented
                console.warn('Autoplay prevented, user interaction required:', error);
                URL.revokeObjectURL(url);
                
                // Return a special object to indicate autoplay was blocked
                resolve({ 
                  blocked: true, 
                  audio, 
                  url,
                  play: () => {
                    return audio.play().then(() => {
                      audio.onended = () => {
                        URL.revokeObjectURL(url);
                      };
                    });
                  }
                });
              });
          } else {
            // Old browser, play immediately
            audio.onended = () => {
              URL.revokeObjectURL(url);
              resolve(null);
            };
          }
          
          audio.onerror = (error) => {
            URL.revokeObjectURL(url);
            reject(error);
          };
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      });
    }
    
    // Mobile version - use Expo Audio
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const fileUri = `${FileSystem.cacheDirectory}voice-${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
    
    const sound = new Audio.Sound();
    await sound.loadAsync({ uri: fileUri }, { shouldPlay: true }, true);
    await sound.playAsync();
    
    return sound;
  } catch (error) {
    console.error('Voice playback error:', error);
    throw error;
  }
}

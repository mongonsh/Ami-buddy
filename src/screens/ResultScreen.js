import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS } from '../theme/colors';
import { analyzeImage } from '../services/ocr';
import { playJapaneseVoice, configureAudio } from '../services/elevenLabsService';
import Svg, { Circle, Line } from 'react-native-svg';
import { memorizeConversation } from '../services/memu';
import { Volume2, Save, Star, Sparkles } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';

export default function ResultScreen({ route, navigation }) {
  const { imageUri } = route.params || {};
  const [result, setResult] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const segmentedUri = imageUri || null;
  const [saving, setSaving] = useState(false);
  const { t, locale } = useLanguage();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await analyzeImage(imageUri);
        if (mounted) setResult(r);
        // Segmentation backend is not used; keep original image.
      } catch (error) {
        console.error('Analysis error:', error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [imageUri]);

  const speak = async () => {
    if (speaking) return;
    setSpeaking(true);
    try {
      await configureAudio();
      // Translate the speech text
      const speechText = locale === 'en' ? 'Great job! Amazing!' : 'よく できました！ すごいね！';
      await playJapaneseVoice(speechText, locale);
    } catch (error) {
      console.error('Voice error:', error);
      Alert.alert(t('error'), t('errorVoice'));
    } finally {
      setSpeaking(false);
    }
  };

  const saveMemory = async () => {
    if (!result || saving) return;
    setSaving(true);
    try {
      const conversation = [
        { role: 'assistant', content: 'きょうの しゅくだいの けっか' },
        { role: 'user', content: `みつけた もじ: ${result.tokens.join(' ')}` },
        { role: 'assistant', content: `はんてい: はなまる (${Math.round((result.confidence || 0) * 100)}%)` }
      ];
      await memorizeConversation({
        apiKey: '',
        userId: 'gakusei_001',
        agentId: 'amibuddy_001',
        conversation
      });
      Alert.alert(t('saved'), t('savedMemory'));
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(t('error'), t('errorSave'));
    } finally {
      setSaving(false);
    }
  };

  if (!imageUri) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.skyBlue, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: COLORS.brightBlue, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
          {t('errorLoadImage')}
        </Text>
        <Text style={{ color: COLORS.brightBlue, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          {t('selectImageAgain')}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: COLORS.happyGreen, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 24, borderWidth: 3, borderColor: COLORS.white }}
        >
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold' }}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.skyBlue }}>
      <Image source={{ uri: imageUri }} style={{ width: '100%', height: 280 }} resizeMode="cover" />
      <View style={{ padding: 20 }}>
        <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 3, borderColor: COLORS.brightBlue, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Star color={COLORS.sunnyYellow} size={32} fill={COLORS.sunnyYellow} />
            <Text style={{ color: COLORS.brightBlue, fontSize: 24, marginLeft: 8, fontWeight: 'bold' }}>{t('resultTitle')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Svg height="72" width="72">
              <Circle cx="36" cy="36" r="32" stroke={COLORS.coralPink} strokeWidth="5" fill="none" />
              <Line x1="36" y1="12" x2="36" y2="60" stroke={COLORS.coralPink} strokeWidth="3" />
              <Line x1="12" y1="36" x2="60" y2="36" stroke={COLORS.coralPink} strokeWidth="3" />
            </Svg>
            <Text style={{ marginLeft: 16, color: COLORS.coralPink, fontSize: 22, fontWeight: 'bold' }}>{t('hanamaru')}</Text>
          </View>

          <Text style={{ color: COLORS.brightBlue, fontSize: 20, marginBottom: 8, fontWeight: 'bold' }}>{t('foundCharacters')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(result?.tokens || []).map((t, i) => (
              <View key={`${t}-${i}`} style={{ backgroundColor: COLORS.sunnyYellow, borderColor: COLORS.brightBlue, borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, marginBottom: 10 }}>
                <Text style={{ color: COLORS.brightBlue, fontSize: 20, fontWeight: 'bold' }}>{t}</Text>
              </View>
            ))}
          </View>

          {result?.text && (
            <Text style={{ color: COLORS.brightBlue, fontSize: 18, marginTop: 12, lineHeight: 26 }}>{result.text}</Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={speak}
            style={{ backgroundColor: COLORS.happyGreen, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25, flexDirection: 'row', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 }}
          >
            <Volume2 color={COLORS.white} size={24} />
            <Text style={{ color: COLORS.white, fontSize: 18, marginLeft: 8, fontWeight: 'bold' }}>{speaking ? t('speaking') : t('speak')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={saveMemory}
            style={{ backgroundColor: COLORS.softPurple, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25, flexDirection: 'row', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 }}
          >
            <Save color={COLORS.white} size={24} />
            <Text style={{ color: COLORS.white, fontSize: 18, marginLeft: 8, fontWeight: 'bold' }}>{saving ? t('saving') : t('save')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 3, borderColor: COLORS.brightBlue, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Sparkles color={COLORS.coralPink} size={28} />
            <Text style={{ color: COLORS.brightBlue, fontSize: 22, marginLeft: 8, fontWeight: 'bold' }}>{t('yourBuddy')}</Text>
          </View>
          {segmentedUri ? (
            <View style={{ width: 140, height: 140, borderRadius: 70, overflow: 'hidden', backgroundColor: COLORS.sunnyYellow, borderWidth: 4, borderColor: COLORS.brightBlue, alignSelf: 'center', marginBottom: 16 }}>
              <Image source={{ uri: segmentedUri }} style={{ width: '100%', height: '100%' }} />
            </View>
          ) : null}
          <TouchableOpacity
            onPress={() => {
              if (segmentedUri) navigation.navigate('Dashboard', { buddyImageUri: segmentedUri });
            }}
            style={{ backgroundColor: COLORS.coralPink, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 25, alignSelf: 'center', borderWidth: 3, borderColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 }}
          >
            <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold' }}>{t('makeBuddy')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

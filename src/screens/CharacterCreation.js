import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { Save, User } from 'lucide-react-native';
import { playJapaneseVoice, configureAudio } from '../services/elevenLabsService';
import { segmentDrawing } from '../services/visionService';
import { memorizeCharacterCreation } from '../services/memuService';
import AnimatedCharacter from '../components/AnimatedCharacter';

export default function CharacterCreation({ route, navigation }) {
  const { imageUri } = route.params || {};
  const [characterName, setCharacterName] = useState('');
  const [saving, setSaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [segmentedUri, setSegmentedUri] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await segmentDrawing(imageUri);
        if (mounted) setSegmentedUri(result.segmentedUri);
      } catch (error) {
        console.error('Segmentation error:', error);
      }
    })();
    return () => { mounted = false; };
  }, [imageUri]);

  const handleSave = async () => {
    if (!characterName.trim()) {
      Alert.alert('なまえを いれてね', 'キャラクターの なまえを いれてください');
      return;
    }

    setSaving(true);
    try {
      await configureAudio();
      
      await memorizeCharacterCreation({
        characterName: characterName.trim(),
        drawingImageUri: imageUri,
        createdAt: new Date()
      });
      
      setSpeaking(true);
      const introText = `こんにちは、わたしは ${characterName} です。しゅくだいの がぞうを いれてください。`;
      
      try {
        const result = await playJapaneseVoice(introText);
        
        // Check if autoplay was blocked (web only)
        if (result && result.blocked) {
          console.log('Autoplay blocked, skipping voice');
          // Continue to next screen without voice
        }
      } catch (voiceError) {
        console.warn('Voice playback failed, continuing anyway:', voiceError);
        // Continue even if voice fails
      }
      
      setSpeaking(false);
      
      // Navigate to homework upload
      navigation.navigate('HomeworkUpload', {
        characterName: characterName.trim(),
        characterImage: segmentedUri || imageUri
      });
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('エラー', 'ほぞん できませんでした');
      setSpeaking(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <User color={COLORS.primary} size={28} strokeWidth={2.5} />
          </View>
          <Text style={styles.headerTitle}>キャラクター作成</Text>
          <Text style={styles.headerSubtitle}>あなたの学習パートナーに名前をつけよう</Text>
        </View>

        {/* Character Image */}
        <View style={styles.imageSection}>
          {segmentedUri ? (
            <View style={styles.characterContainer}>
              <AnimatedCharacter 
                imageUri={segmentedUri} 
                size={200} 
                isSpeaking={speaking}
              />
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>よみこみちゅう...</Text>
            </View>
          )}
        </View>

        {/* Name Input Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>キャラクター名</Text>
          <TextInput
            style={styles.input}
            placeholder="なまえを入力してください"
            placeholderTextColor={COLORS.gray[400]}
            value={characterName}
            onChangeText={setCharacterName}
            maxLength={20}
            autoFocus={true}
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>{characterName.length}/20</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !characterName.trim()}
          style={[
            styles.saveButton,
            (saving || !characterName.trim()) && styles.saveButtonDisabled
          ]}
          activeOpacity={0.8}
        >
          <Save color={COLORS.white} size={22} strokeWidth={2.5} />
          <Text style={styles.saveButtonText}>
            {saving ? 'ほぞんちゅう...' : '保存して次へ'}
          </Text>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>
            名前を保存すると、キャラクターが自己紹介します
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.blue[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  characterContainer: {
    padding: 20,
  },
  loadingContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderStyle: 'dashed',
  },
  loadingText: {
    color: COLORS.gray[600],
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    color: COLORS.gray[900],
    fontWeight: '600',
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray[300],
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoBox: {
    backgroundColor: COLORS.blue[50],
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[700],
    fontWeight: '500',
    lineHeight: 20,
  },
});

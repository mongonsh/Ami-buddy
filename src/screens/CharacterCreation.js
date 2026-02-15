import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../theme/colors';
import { Save, User, ChevronLeft } from 'lucide-react-native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth, db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { playJapaneseVoice, configureAudio } from '../services/elevenLabsService';
import { segmentCharacter, generateAnimation } from '../services/animationService';
import { useLanguage } from '../contexts/LanguageContext';
import { Video } from 'expo-av';
import AnimatedCharacter from '../components/AnimatedCharacter';
import LiveBuddy from '../components/LiveBuddy';

export default function CharacterCreation({ route, navigation }) {
  const { imageUri } = route.params || {};
  const [characterName, setCharacterName] = useState('');
  const [saving, setSaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [segmentedUri, setSegmentedUri] = useState(null);
  const [rigData, setRigData] = useState(null);
  const [partUrls, setPartUrls] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const { t } = useLanguage();
  const [error, setError] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log('Starting segmentation for:', imageUri);
        // Set segmentedUri to null to show loading state
        setSegmentedUri(null);
        setPartUrls(null);

        // Play loading voice message
        const loadingText = t('loading') || 'Generating character... Please wait.';
        playJapaneseVoice(loadingText).catch(err => console.log('Voice preview warning:', err));

        const result = await segmentCharacter(imageUri);

        if (mounted && result) {
          console.log('Segmentation complete:', result);
          setRigData(result.rig_data);
          setPartUrls(result.part_urls); // Store parts

          // Set segmentedUri to indicate completion
          setSegmentedUri(imageUri);
        } else if (mounted) {
          // Fallback if null
          setSegmentedUri(imageUri);
        }
      } catch (error) {
        console.error('Segmentation error:', error);
        if (mounted) setSegmentedUri(imageUri);
      }
    })();
    return () => { mounted = false; };
  }, [imageUri]);

  const showError = (message) => {
    if (Platform.OS === 'web') {
      setError(message);
      setTimeout(() => setError(null), 5000);
    } else {
      Alert.alert(t('error'), message);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!characterName.trim()) {
      showError(t('errorNameRequired') || 'Please enter a character name');
      return;
    }

    setSaving(true);
    try {
      await configureAudio();

      const uriToSave = segmentedUri || imageUri;
      let storageUrl = uriToSave;

      console.log('handleSave: uriToSave length:', uriToSave ? uriToSave.length : 0);
      console.log('handleSave: uriToSave startsWith:', uriToSave ? uriToSave.substring(0, 30) : 'null');

      // Upload to Firebase Storage if it's a local/blob/data URI
      if (uriToSave && (uriToSave.startsWith('blob:') || uriToSave.startsWith('file:') || uriToSave.startsWith('data:'))) {
        console.log('handleSave: processing upload...');
        try {
          let blob;
          if (uriToSave.startsWith('data:')) {
            // Convert base64 data URI to Blob
            const byteString = atob(uriToSave.split(',')[1]);
            const mimeString = uriToSave.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            blob = new Blob([ab], { type: mimeString });
          } else {
            const response = await fetch(uriToSave);
            blob = await response.blob();
          }
          const filename = `characters/${auth.currentUser.uid}/${Date.now()}.jpg`;
          const storageRef = ref(storage, filename);

          await uploadBytes(storageRef, blob);
          storageUrl = await getDownloadURL(storageRef);
          console.log('Uploaded character image:', storageUrl);
        } catch (uploadError) {
          console.error('Image upload failed, falling back to original URI (might fail on web refresh):', uploadError);
          // We continue, but saving blob URI is risky. 
          // If upload fails, maybe we should stop? 
          // For now, let's try to proceed or just throw.
          throw new Error('Failed to upload image to storage');
        }
      }

      const charData = {
        name: characterName,
        createdAt: new Date(),
        imageUri: storageUrl, // Save the storage URL
        rigData: rigData || null,
        partUrls: partUrls || null
      };

      if (auth.currentUser) {
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'characters'), charData);
      }

      const params = {
        characterName,
        characterImage: storageUrl,
        rigData,
        partUrls
      };

      // Navigate to homework upload
      navigation.navigate('HomeworkUpload', params);
    } catch (error) {
      console.error('Save error:', error);
      showError(t('errorSave') || 'Failed to save character');
      setSpeaking(false);
    } finally {
      setSaving(false);
    }
  }

  const handleAnimate = async () => {
    if (isAnimating || videoUri) return;

    setIsAnimating(true);
    try {
      const uri = segmentedUri || imageUri;
      console.log('Starting animation for:', uri);
      // DEBUG: Alert start
      // Alert.alert('Debug', 'Starting animation request...');

      const video = await generateAnimation(uri, characterName || "A friendly character");

      if (video) {
        setVideoUri(video);
        console.log('Animation video set:', video);
        // DEBUG: Alert success
        Alert.alert('Success', 'Video generated! URI: ' + video);
      } else {
        Alert.alert('エラー', 'どうがの さくせいに しっぱいしました (Result null)');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', `どうがの さくせいに しっぱいしました: ${e.message}`);
    } finally {
      setIsAnimating(false);
    }
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ChevronLeft color={COLORS.gray[700]} size={28} />
            </TouchableOpacity>
            <View style={styles.headerIcon}>
              <User color={COLORS.primary} size={28} strokeWidth={2.5} />
            </View>
          </View>
          <Text style={styles.headerTitle}>{t('createCharacter')}</Text>
          <Text style={styles.headerSubtitle}>{t('nameCharacter')}</Text>
        </View>

        {error && (
          <View style={{ backgroundColor: '#ffebee', padding: 10, marginBottom: 20, borderRadius: 8 }}>
            <Text style={{ color: '#c62828', textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        {/* Character Image */}
        <View style={styles.imageSection}>
          {segmentedUri ? (
            <View style={styles.characterContainer}>
              {videoUri && Platform.OS !== 'web' ? (
                <Video
                  source={{ uri: videoUri }}
                  style={{ width: 200, height: 200 }}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                  shouldPlay
                />
              ) : partUrls ? (
                <LiveBuddy
                  partUrls={partUrls}
                  rigData={rigData}
                  speaking={speaking}
                />
              ) : (
                <AnimatedCharacter
                  imageUri={segmentedUri}
                  size={200}
                  isSpeaking={speaking}
                />
              )}

              {/* Hide Animation button on Web for now */}
              {!videoUri && Platform.OS !== 'web' && (
                <TouchableOpacity
                  style={styles.animateButton}
                  onPress={handleAnimate}
                  disabled={isAnimating}
                >
                  {isAnimating ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.animateButtonText}>{t('animate')}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>{t('loading')}</Text>
            </View>
          )}
        </View>

        {/* Name Input Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>{t('characterName')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('namePlaceholder')}
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
            (saving || !characterName.trim()) && styles.saveButtonDisabled,
            saving && { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.primary } // Style change for loading
          ]}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <>
              <Save color={COLORS.white} size={22} strokeWidth={2.5} />
              <Text style={styles.saveButtonText}>{t('saveCharacter')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>
            {t('saveCharacterInfo')}
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
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    gap: 16
  },
  backButton: {
    padding: 8,
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    marginBottom: 16 // align with icon
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

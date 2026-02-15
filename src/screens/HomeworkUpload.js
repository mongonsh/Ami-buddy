import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Dimensions, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../theme/colors';
import { Upload, FolderOpen, Volume2, Mic, MicOff, FileImage, MessageCircle, ChevronLeft } from 'lucide-react-native';
import { playJapaneseVoice, configureAudio } from '../services/elevenLabsService';
import { analyzeHomeworkWithGemini, reviewHomeworkWithGemini } from '../services/geminiService';
import { startRecording, stopRecording, getConversationResponse, transcribeAudioWithGemini } from '../services/voiceConversationService';
// import { memorizeHomeworkSession, memorizeConversation } from '../services/memuService'; // Removed MemU
import AnimatedCharacter from '../components/AnimatedCharacter';
import LiveBuddy from '../components/LiveBuddy';
import { liveAnimationService } from '../services/liveAnimationService';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext'; // Import AuthContext

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;

const HOMEWORK_IMAGES = [
  { id: 1, source: require('../../public/homeworks/image.png'), name: 'Homework 1' },
];

import { useLanguage } from '../contexts/LanguageContext';

export default function HomeworkUpload({ route, navigation }) {
  const { characterName, characterImage, characterVideo, rigData, partUrls } = route.params || {};
  const { userData } = useAuth(); // Get user data
  const userName = userData?.displayName || ''; // Get user name
  const { t, locale } = useLanguage();

  useEffect(() => {
    if (characterName) {
      liveAnimationService.connect(characterName);
    }
    return () => {
      liveAnimationService.disconnect();
    }
  }, [characterName]);

  // Initial greeting
  useEffect(() => {
    let mounted = true;
    const playIntro = async () => {
      // Small delay to allow transition to finish
      await new Promise(resolve => setTimeout(resolve, 800));
      if (!mounted) return;

      let introText = t('homeworkIntro') || 'Hello! Please upload your homework.';

      // Personalize
      if (userName) {
        if (locale === 'jp') {
          // "Name-san, " + text
          // Ensure text doesn't start with a name if translation already has it (unlikely)
          introText = `${userName}さん、${introText}`;
        } else {
          // "Hi Name, " + text
          introText = `Hi ${userName}! ${introText}`;
        }
      }

      setSpeaking(true);
      try {
        await configureAudio();
        await playJapaneseVoice(introText, locale);
      } catch (err) {
        console.log('Intro voice error:', err);
      } finally {
        if (mounted) setSpeaking(false);
      }
    };

    playIntro();
    return () => { mounted = false; };
  }, []);



  const [homeworkUri, setHomeworkUri] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [result, setResult] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Timer states
  const [timerStarted, setTimerStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lessonFinished, setLessonFinished] = useState(false);

  // Review states
  const [showReview, setShowReview] = useState(false);
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Timer effect
  React.useEffect(() => {
    let interval;
    if (timerStarted && !lessonFinished) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerStarted, lessonFinished]);

  const saveAndNavigate = async () => {
    try {
      if (auth.currentUser) {
        setShowSuccessModal(false);
        const magicCardUrl = `https://ui-avatars.com/api/?name=${characterName}+Card&background=F59E0B&color=fff&size=512&font-size=0.33`;
        const userRef = doc(db, 'users', auth.currentUser.uid);

        let storageUrl = homeworkUri;
        // Upload homework image to Storage
        if (homeworkUri && (homeworkUri.startsWith('blob:') || homeworkUri.startsWith('file:') || homeworkUri.startsWith('data:'))) {
          try {
            const response = await fetch(homeworkUri);
            const blob = await response.blob();
            const filename = `homeworks/${auth.currentUser.uid}/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, blob);
            storageUrl = await getDownloadURL(storageRef);
            console.log('Uploaded homework image:', storageUrl);
          } catch (uploadError) {
            console.error('Homework upload failed:', uploadError);
            // Proceed with original URI or fail? Proceeding might fail addDoc if base64.
            // But let's try to proceed.
          }
        }

        await addDoc(collection(db, 'users', auth.currentUser.uid, 'homeworks'), {
          characterName,
          homeworkImage: storageUrl,
          description: result?.description || '',
          topics: result?.topics || [],
          difficulty: result?.difficulty || '',
          durationSeconds: elapsedTime,
          completedAt: new Date(),
          score: reviewResult?.score || 100,
          feedback: reviewResult?.feedback || 'Great job!',
          magicCardUrl: magicCardUrl
        });
        const { increment } = require('firebase/firestore');
        await updateDoc(userRef, {
          homeworkCount: increment(1)
        });
        console.log('Homework session saved');
      }
    } catch (e) {
      console.error("Error saving homework:", e);
      Alert.alert('Error', 'Failed to save homework history');
    }
    navigation.navigate('Dashboard');
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const analyzeAndSpeak = async (imageUri) => {
    setAnalyzing(true);
    try {
      // Pass locale to analysis service to get response in correct language
      const analysis = await analyzeHomeworkWithGemini(imageUri, locale);
      setResult(analysis);

      // Start timer when homework is analyzed
      if (!timerStarted) {
        setTimerStarted(true);
      }

      setSpeaking(true);
      await configureAudio();

      try {
        // Personalize voice
        let message = analysis.description;
        if (locale === 'jp') {
          const prefix = userName ? `${userName}さん、` : '';
          message = prefix + message;
        } else {
          const prefix = userName ? `Hi ${userName}, ` : '';
          message = prefix + message;
        }

        // Pass locale to voice service
        const playResult = await playJapaneseVoice(message, locale);
        if (playResult && playResult.blocked) {
          console.log('Autoplay blocked, user can click replay button');
        }
      } catch (voiceError) {
        console.warn('Voice playback failed:', voiceError);
      }

      setSpeaking(false);
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(t('error'), t('error'));
      setSpeaking(false);
    } finally {
      setAnalyzing(false);
    }
  };

  const [showLimitModal, setShowLimitModal] = useState(false);

  const checkLimit = () => {
    if (userData?.homeworkCount >= 5 && !userData?.isPremium) {
      setShowLimitModal(true);
      return false;
    }
    return true;
  };

  const handleLocalImage = async (imageSource) => {
    if (!checkLimit()) return;

    const resolvedSource = Image.resolveAssetSource(imageSource);
    setHomeworkUri(resolvedSource.uri);
    await analyzeAndSpeak(resolvedSource.uri);
  };

  // Helper to show errors
  const showError = (message) => {
    if (Platform.OS === 'web') {
      setError(message);
    } else {
      Alert.alert(t('error') || 'Error', message);
    }
  };

  const handlePickImage = async () => {
    setError(null);
    if (!checkLimit()) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError(t('permissionRequired') || 'Permission required to access photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8, // Reduced quality slightly for faster web upload
        base64: true, // Request base64 directly to avoid re-reading blob if possible
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const uri = asset.uri;
        setHomeworkUri(uri);
        // If getting base64 from picker, we could pass it to service, 
        // but verify service handles it. Service infers from URI or reads file.
        await analyzeAndSpeak(uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showError(t('pickImageError') || 'Failed to pick image');
    }
  };

  const handlePickFromFiles = async () => {
    if (!checkLimit()) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      const uri = asset?.uri;

      if (uri) {
        setHomeworkUri(uri);
        await analyzeAndSpeak(uri);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('エラー', 'ファイルを選べませんでした');
    }
  };

  const handleReplay = async () => {
    if (!result) return;
    setSpeaking(true);
    try {
      await configureAudio();
      const playResult = await playJapaneseVoice(result.description);

      if (playResult && playResult.blocked && playResult.play) {
        await playResult.play();
      }
    } catch (error) {
      console.error('Voice error:', error);
      Alert.alert('エラー', '音声の再生に失敗しました');
    } finally {
      setSpeaking(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const rec = await startRecording();
      setRecording(rec);
      setIsRecording(true);
    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert('エラー', '音声を録音できませんでした');
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setProcessing(true);

    try {
      const audioUri = await stopRecording(recording);
      setRecording(null);

      const question = await transcribeAudioWithGemini(audioUri, locale);
      const newHistory = [...conversationHistory, { role: 'user', content: question }];
      setConversationHistory(newHistory);

      const answer = await getConversationResponse(
        question,
        result?.description || '',
        conversationHistory,
        locale
      );

      setConversationHistory([...newHistory, { role: 'assistant', content: answer }]);

      /*
      await memorizeConversation({
        characterName,
        question,
        answer,
        homeworkContext: result?.description
      });
      */

      setSpeaking(true);
      await configureAudio();

      try {
        const playResult = await playJapaneseVoice(answer);
        if (playResult && playResult.blocked && playResult.play) {
          await playResult.play();
        }
      } catch (voiceError) {
        console.warn('Voice playback failed:', voiceError);
      }

      setSpeaking(false);

    } catch (error) {
      console.error('Recording processing error:', error);
      Alert.alert('エラー', '音声の処理ができませんでした');
      setSpeaking(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleFinishLesson = async () => {
    setLessonFinished(true);
    setTimerStarted(false);

    const inspirationalMessages = t('inspirationalMessages');
    // Fallback if t returns string or undefined (though strict mode might behave differently)
    const messages = Array.isArray(inspirationalMessages) ? inspirationalMessages : [
      'Great job!', 'You did it!'
    ];

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    const message = userName ? (locale === 'jp' ? `${userName}さん、${randomMsg}` : `${userName}, ${randomMsg}`) : randomMsg;

    setSpeaking(true);
    try {
      await configureAudio();
      const playResult = await playJapaneseVoice(message);
      if (playResult && playResult.blocked && playResult.play) {
        await playResult.play();
      }
    } catch (error) {
      console.warn('Voice playback failed:', error);
    } finally {
      setSpeaking(false);
    }

    setShowSuccessModal(true);
  };

  const handlePickReviewImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showError(t('permissionRequired') || 'Permission required');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: Platform.OS !== 'web',
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        setReviewImage(uri);
        await handleReviewHomework(uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('エラー', '写真を選べませんでした');
    }
  };

  const handleReviewHomework = async (imageUri) => {
    setReviewLoading(true);
    try {
      const review = await reviewHomeworkWithGemini(imageUri, result?.description || '');
      setReviewResult(review);

      setSpeaking(true);
      await configureAudio();

      try {
        const playResult = await playJapaneseVoice(review.feedback);
        if (playResult && playResult.blocked && playResult.play) {
          await playResult.play();
        }
      } catch (voiceError) {
        console.warn('Voice playback failed:', voiceError);
      }

      setSpeaking(false);
    } catch (error) {
      console.error('Review error:', error);
      Alert.alert('エラー', '宿題のレビューができませんでした');
      setSpeaking(false);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ChevronLeft color={COLORS.gray[700]} size={28} />
      </TouchableOpacity>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
          {/* Left Column - Character */}
          <View style={[styles.leftColumn, isMobile && styles.leftColumnMobile]}>
            <View style={[styles.characterCard, isMobile && styles.characterCardMobile]}>
              {partUrls && Object.keys(partUrls).length > 0 ? (
                <View style={{ width: 300, height: 300, justifyContent: 'center', alignItems: 'center' }}>
                  <LiveBuddy
                    partUrls={partUrls}
                    rigData={rigData}
                    speaking={speaking}
                    emotion="neutral"
                  />
                </View>
              ) : characterVideo ? (
                <View
                  style={[
                    styles.characterImageContainer,
                    {
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      aspectRatio: 1, // Keep square aspect ratio
                      // borderRadius removed to show full rectangle if needed, or small radius for card look
                      borderRadius: 12,
                      overflow: 'hidden',
                      backgroundColor: '#f0f0f0', // Slight gray background to see bounds
                      borderWidth: 3,
                      borderColor: speaking ? COLORS.sunnyYellow : COLORS.brightBlue,
                    }
                  ]}
                >
                  <Video
                    source={{ uri: characterVideo }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain" // Contain to show full video content
                    isLooping
                    shouldPlay={speaking}

                    isMuted={false}
                    onError={(e) => console.error('Video playback error:', e)}
                    onLoad={() => console.log('Video loaded successfully')}
                  />
                </View>
              ) : (
                characterImage && (
                  <View style={styles.characterImageContainer}>
                    <AnimatedCharacter
                      imageUri={characterImage}
                      size={isMobile ? 150 : 200}
                      isSpeaking={speaking}
                    />
                  </View>
                )
              )}

              {/* Character Name - Always at bottom */}
              <View style={[styles.characterNameContainer, isMobile && styles.characterNameContainerMobile]}>
                <Text style={[styles.characterName, isMobile && styles.characterNameMobile]}>{characterName}</Text>
                <Text style={[styles.characterStatus, isMobile && styles.characterStatusMobile]}>
                  {speaking ? '話しています...' : analyzing ? '分析中...' : lessonFinished ? '完了！' : '準備完了'}
                </Text>
              </View>
            </View>

            {/* Timer - Separate card on mobile */}
            {timerStarted && isMobile && (
              <View style={[styles.timerContainer, styles.timerContainerMobile]}>
                <Text style={[styles.timerLabel, styles.timerLabelMobile]}>{t('lessonTime')}</Text>
                <Text style={[styles.timerText, styles.timerTextMobile]}>{formatTime(elapsedTime)}</Text>
              </View>
            )}

            {/* Timer - Inside card on desktop */}
            {timerStarted && !isMobile && (
              <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>{t('lessonTime')}</Text>
                <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
              </View>
            )}

            {/* Finish Button */}
            {result && timerStarted && !lessonFinished && (
              <TouchableOpacity
                onPress={handleFinishLesson}
                style={[styles.finishButton, isMobile && styles.finishButtonMobile]}
                activeOpacity={0.8}
              >
                <Text style={[styles.finishButtonText, isMobile && styles.finishButtonTextMobile]}>{t('finishLesson')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Right Column - Homework */}
          <View style={[styles.rightColumn, isMobile && styles.rightColumnMobile]}>
            {!homeworkUri ? (
              // Upload Section
              <View style={styles.uploadSection}>
                <View style={styles.uploadHeader}>
                  <FileImage color={COLORS.primary} size={28} strokeWidth={2.5} />
                  <Text style={styles.uploadTitle}>{t('uploadHomework')}</Text>
                </View>

                {error && (
                  <View style={{ backgroundColor: '#ffebee', padding: 10, marginVertical: 10, borderRadius: 8 }}>
                    <Text style={{ color: '#c62828', textAlign: 'center' }}>{error}</Text>
                  </View>
                )}

                {/* Local Gallery */}
                <View style={styles.localGallery}>
                  <Text style={styles.sectionLabel}>{t('sampleImage')}</Text>
                  <View style={styles.galleryGrid}>
                    {HOMEWORK_IMAGES.map((image) => (
                      <TouchableOpacity
                        key={image.id}
                        onPress={() => handleLocalImage(image.source)}
                        style={styles.galleryItem}
                        activeOpacity={0.7}
                      >
                        <Image source={image.source} style={styles.galleryImage} resizeMode="cover" />
                        <View style={styles.galleryOverlay}>
                          <Text style={styles.galleryText}>{image.name}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Upload Buttons */}
                <View style={styles.uploadButtons}>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={[styles.uploadButton, styles.uploadButtonPrimary]}
                    activeOpacity={0.8}
                  >
                    <FolderOpen color={COLORS.white} size={22} strokeWidth={2.5} />
                    <Text style={styles.uploadButtonText}>{t('uploadGallery')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePickFromFiles}
                    style={[styles.uploadButton, styles.uploadButtonSecondary]}
                    activeOpacity={0.8}
                  >
                    <Upload color={COLORS.white} size={22} strokeWidth={2.5} />
                    <Text style={styles.uploadButtonText}>{t('uploadFile')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Result Section
              <View style={styles.resultSection}>
                {/* Homework Image */}
                <View style={styles.imageCard}>
                  <Image source={{ uri: homeworkUri }} style={styles.homeworkImage} resizeMode="contain" />
                </View>

                {/* Analyzing State */}
                {analyzing && (
                  <View style={styles.analyzingCard}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.analyzingText}>{t('analyzing')}</Text>
                  </View>
                )}

                {/* Analysis Result */}
                {result && !analyzing && (
                  <View style={styles.analysisCard}>
                    <View style={styles.analysisHeader}>
                      <Text style={styles.analysisTitle}>{t('result')}</Text>
                      <TouchableOpacity
                        onPress={handleReplay}
                        disabled={speaking}
                        style={styles.replayButton}
                        activeOpacity={0.7}
                      >
                        <Volume2 color={COLORS.primary} size={20} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.description}>{result.description}</Text>

                    {result.topics && result.topics.length > 0 && (
                      <View style={styles.topicsSection}>
                        <Text style={styles.topicsLabel}>{t('topics')}</Text>
                        <View style={styles.topicsList}>
                          {result.topics.map((topic, index) => (
                            <View key={index} style={styles.topicBadge}>
                              <Text style={styles.topicText}>{topic}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {result.difficulty && (
                      <View style={styles.difficultySection}>
                        <Text style={styles.difficultyLabel}>{t('difficulty')}</Text>
                        <View style={styles.difficultyBadge}>
                          <Text style={styles.difficultyText}>{result.difficulty}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Voice Conversation */}
                {result && !analyzing && (
                  <View style={styles.conversationCard}>
                    <View style={styles.conversationHeader}>
                      <MessageCircle color={COLORS.accent} size={24} strokeWidth={2.5} />
                      <Text style={styles.conversationTitle}>{t('askQuestion')}</Text>
                    </View>

                    {/* Conversation History */}
                    {conversationHistory.length > 0 && (
                      <View style={styles.conversationHistory}>
                        {conversationHistory.map((msg, index) => (
                          <View
                            key={index}
                            style={[
                              styles.messageBubble,
                              msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                            ]}
                          >
                            <Text style={styles.messageRole}>
                              {msg.role === 'user' ? (locale === 'jp' ? 'あなた' : 'You') : characterName}
                            </Text>
                            <Text style={styles.messageContent}>{msg.content}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Recording Button */}
                    <TouchableOpacity
                      onPress={isRecording ? handleStopRecording : handleStartRecording}
                      disabled={processing || speaking}
                      style={[
                        styles.recordButton,
                        isRecording && styles.recordButtonActive,
                        (processing || speaking) && styles.recordButtonDisabled
                      ]}
                      activeOpacity={0.8}
                    >
                      {isRecording ? (
                        <MicOff color={COLORS.white} size={24} strokeWidth={2.5} />
                      ) : (
                        <Mic color={COLORS.white} size={24} strokeWidth={2.5} />
                      )}
                      <Text style={styles.recordButtonText}>
                        {processing ? t('processing') : isRecording ? t('recordStop') : t('recordStart')}
                      </Text>
                    </TouchableOpacity>

                    {isRecording && (
                      <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>{t('recording')}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Review Section */}
                {result && !analyzing && lessonFinished && (
                  <View style={styles.reviewSection}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewTitle}>{t('reviewHomework')}</Text>
                    </View>

                    {!reviewImage ? (
                      <TouchableOpacity
                        onPress={handlePickReviewImage}
                        style={styles.reviewUploadButton}
                        activeOpacity={0.8}
                      >
                        <Upload color={COLORS.white} size={24} strokeWidth={2.5} />
                        <Text style={styles.reviewUploadText}>{t('uploadFinished')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.reviewContent}>
                        {/* Review Image */}
                        <View style={styles.reviewImageCard}>
                          <Image source={{ uri: reviewImage }} style={styles.reviewImage} resizeMode="contain" />
                        </View>

                        {/* Loading */}
                        {reviewLoading && (
                          <View style={styles.reviewLoadingCard}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.reviewLoadingText}>{t('reviewing')}</Text>
                          </View>
                        )}

                        {/* Review Result */}
                        {reviewResult && !reviewLoading && (
                          <View style={styles.reviewResultCard}>
                            <View style={styles.reviewScoreContainer}>
                              <Text style={styles.reviewSticker}>{reviewResult.sticker}</Text>
                              <Text style={styles.reviewScore}>{reviewResult.score}{t('score')}</Text>
                            </View>

                            <Text style={styles.reviewFeedback}>{reviewResult.feedback}</Text>

                            {reviewResult.strengths && reviewResult.strengths.length > 0 && (
                              <View style={styles.reviewStrengthsSection}>
                                <Text style={styles.reviewSectionLabel}>{t('strengths')}</Text>
                                {reviewResult.strengths.map((strength, index) => (
                                  <View key={index} style={styles.reviewItem}>
                                    <Text style={styles.reviewItemText}>✓ {strength}</Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {reviewResult.improvements && reviewResult.improvements.length > 0 && (
                              <View style={styles.reviewImprovementsSection}>
                                <Text style={styles.reviewSectionLabel}>{t('improvements')}</Text>
                                {reviewResult.improvements.map((improvement, index) => (
                                  <View key={index} style={styles.reviewItem}>
                                    <Text style={styles.reviewItemText}>→ {improvement}</Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Try Again Button */}
                            <TouchableOpacity
                              onPress={() => {
                                setReviewImage(null);
                                setReviewResult(null);
                              }}
                              style={styles.reviewAgainButton}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.reviewAgainText}>{t('reviewAgain')}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Reset Button */}
                <TouchableOpacity
                  onPress={() => {
                    setHomeworkUri(null);
                    setResult(null);
                    setConversationHistory([]);
                  }}
                  style={styles.resetButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetButtonText}>{t('reset')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Limit Reached Modal */}
      {showLimitModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ {t('limitReached') || 'Limit Reached'}</Text>
            <Text style={styles.modalMessage}>
              {t('upgradeForUnlimited') || 'You have reached your daily limit of 5 homeworks. Upgrade to Premium for unlimited access!'}
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: COLORS.sunnyYellow, marginBottom: 10 }]}
              onPress={() => {
                setShowLimitModal(false);
                navigation.navigate('Paywall');
              }}
            >
              <Text style={[styles.modalButtonText, { color: COLORS.navy }]}>{t('upgradeNow') || 'Upgrade Now'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.gray[300] }]}
              onPress={() => setShowLimitModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: COLORS.gray[600] }]}>{t('maybeLater') || 'Maybe Later'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 {t('lessonFinished') || 'Lesson Finished!'}</Text>
            <Text style={styles.modalMessage}>
              {userName ? `${userName}さん、` : ''}{t('greatJob') || 'Great job!'}
              {'\n\n'}
              {t('time')}: {formatTime(elapsedTime)}
            </Text>
            <Text style={styles.modalSubMessage}>✨ {t('magicCardEarned') || 'You earned a magic card!'}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={saveAndNavigate}
            >
              <Text style={styles.modalButtonText}>{t('returnHome') || 'Return to Home'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  mainContent: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  mainContentMobile: {
    flexDirection: 'column',
    gap: 16,
  },

  // Left Column - Character
  leftColumn: {
    width: '48%', // Changed to approx 50%
    minWidth: 320,
  },
  leftColumnMobile: {
    width: '100%',
    minWidth: 'auto',
  },
  characterCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
    position: 'sticky',
    top: 80,
  },
  characterCardMobile: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    top: 0,
    marginBottom: 16,
  },
  characterImageContainer: {
    marginBottom: 24,
  },
  characterNameContainer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: COLORS.gray[200],
    width: '100%',
  },
  characterNameContainerMobile: {
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: COLORS.gray[200],
  },
  characterName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  characterNameMobile: {
    fontSize: 18,
    marginBottom: 4,
  },
  characterStatus: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  characterStatusMobile: {
    fontSize: 13,
  },

  // Timer
  timerContainer: {
    backgroundColor: COLORS.blue[50],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.blue[200],
  },
  timerContainerMobile: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.blue[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  timerLabelMobile: {
    fontSize: 13,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  timerTextMobile: {
    fontSize: 36,
  },

  // Finish Button
  finishButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  finishButtonMobile: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 0,
    borderRadius: 12,
  },
  finishButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  finishButtonTextMobile: {
    fontSize: 16,
  },

  // Right Column - Homework
  rightColumn: {
    flex: 1,
  },
  rightColumnMobile: {
    width: '100%',
  },

  // Upload Section
  uploadSection: {
    gap: 24,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  localGallery: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    letterSpacing: 0.3,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryItem: {
    width: (width < 768 ? (width - 72) / 2 : 180),
    height: (width < 768 ? (width - 72) / 2 : 180),
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
  },
  galleryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  uploadButtonSecondary: {
    backgroundColor: COLORS.accent,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Result Section
  resultSection: {
    gap: 20,
  },
  imageCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  homeworkImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  analyzingCard: {
    backgroundColor: COLORS.blue[50],
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: COLORS.blue[100],
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  analysisCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  replayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.gray[700],
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '500',
  },
  topicsSection: {
    marginBottom: 16,
  },
  topicsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  topicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicBadge: {
    backgroundColor: COLORS.blue[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.blue[200],
  },
  topicText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  difficultySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  difficultyBadge: {
    backgroundColor: COLORS.orange[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.orange[200],
  },
  difficultyText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  conversationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.orange[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  conversationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  conversationHistory: {
    gap: 12,
    marginBottom: 16,
  },
  messageBubble: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  userBubble: {
    backgroundColor: COLORS.blue[50],
    borderWidth: 1,
    borderColor: COLORS.blue[200],
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  assistantBubble: {
    backgroundColor: COLORS.orange[50],
    borderWidth: 1,
    borderColor: COLORS.orange[200],
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  messageContent: {
    fontSize: 15,
    color: COLORS.gray[800],
    lineHeight: 22,
    fontWeight: '500',
  },
  recordButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recordButtonActive: {
    backgroundColor: COLORS.accent,
  },
  recordButtonDisabled: {
    backgroundColor: COLORS.gray[300],
    shadowOpacity: 0,
  },
  recordButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  resetButton: {
    backgroundColor: COLORS.gray[100],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  resetButtonText: {
    color: COLORS.gray[700],
    fontSize: 16,
    fontWeight: '600',
  },

  // Review Section
  reviewSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  reviewUploadButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewUploadText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  reviewContent: {
    gap: 16,
  },
  reviewImageCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  reviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  reviewLoadingCard: {
    backgroundColor: COLORS.orange[50],
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.orange[100],
  },
  reviewLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  reviewResultCard: {
    backgroundColor: COLORS.orange[50],
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.orange[200],
    gap: 16,
  },
  reviewScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.orange[300],
  },
  reviewSticker: {
    fontSize: 48,
  },
  reviewScore: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.accent,
  },
  reviewFeedback: {
    fontSize: 16,
    color: COLORS.gray[800],
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewStrengthsSection: {
    gap: 8,
  },
  reviewImprovementsSection: {
    gap: 8,
  },
  reviewSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  reviewItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.orange[200],
  },
  reviewItemText: {
    fontSize: 15,
    color: COLORS.gray[800],
    fontWeight: '500',
  },
  reviewAgainButton: {
    backgroundColor: COLORS.gray[100],
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    marginTop: 8,
  },
  reviewAgainText: {
    color: COLORS.gray[700],
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 18,
    color: COLORS.gray[800],
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  modalSubMessage: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 30,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

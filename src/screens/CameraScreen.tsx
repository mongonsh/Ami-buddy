import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import { COLORS } from '../theme/colors';
import { FlipHorizontal, Image as ImageIcon, Upload, Camera, Sparkles, FolderOpen } from 'lucide-react-native';
import { segmentDrawing } from '../services/visionService';
import WebCamera from '../components/WebCamera';

type Props = {
  navigation: any;
};

export default function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [busy, setBusy] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [loading, setLoading] = useState(false);
  const [showWebCamera, setShowWebCamera] = useState(false);
  const isSimulator = Platform.OS !== 'web' && !Constants.isDevice;
  const isWeb = Platform.OS === 'web';

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.skyBlue, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.brightBlue} />
        <Text style={{ color: COLORS.brightBlue, fontSize: 20, marginTop: 16, fontWeight: 'bold' }}>カメラを よういしています…</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.skyBlue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Camera color={COLORS.brightBlue} size={80} strokeWidth={2.5} />
        <Text style={{ color: COLORS.brightBlue, fontSize: 24, marginTop: 20, marginBottom: 12, fontWeight: 'bold', textAlign: 'center' }}>カメラの アクセスが ひつようです</Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: COLORS.happyGreen, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, marginTop: 16, borderWidth: 3, borderColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6 }}
        >
          <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: 'bold' }}>きょかする</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onPickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('アクセスが ひつようです', 'しゃしんを えらぶには きょかが ひつようです');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.95,
        base64: false,
        allowsMultipleSelection: false
      });
      if (!result.canceled && result.assets?.length) {
        setLoading(true);
        const asset = result.assets[0];
        await segmentDrawing(asset.uri);
        navigation.navigate(Platform.OS === 'web' ? 'CharacterCreation' : 'Result', { imageUri: asset.uri });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('エラー', 'しゃしんを えらべませんでした');
    } finally {
      setLoading(false);
    }
  };

  const onPickFromFiles = async () => {
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
        setLoading(true);
        await segmentDrawing(uri);
        navigation.navigate(Platform.OS === 'web' ? 'CharacterCreation' : 'Result', { imageUri: uri });
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('エラー', 'ファイルを えらべませんでした');
    } finally {
      setLoading(false);
    }
  };

  const handleWebCameraCapture = async (imageUrl: string) => {
    setShowWebCamera(false);
    setLoading(true);
    try {
      await segmentDrawing(imageUrl);
      navigation.navigate('CharacterCreation', { imageUri: imageUrl });
    } catch (error) {
      console.error('Web camera capture error:', error);
      Alert.alert('エラー', 'しゃしんの しょりが できませんでした');
    } finally {
      setLoading(false);
    }
  };

  const capture = async () => {
    if (Platform.OS === 'web') {
      setShowWebCamera(true);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9, base64: false });
      if (photo?.uri) {
        setLoading(true);
        await segmentDrawing(photo.uri);
        navigation.navigate(Platform.OS === 'web' ? 'CharacterCreation' : 'Result', { imageUri: photo.uri });
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('エラー', 'しゃしんが とれませんでした');
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? COLORS.white : COLORS.black }}>
      {/* Web Camera Modal */}
      {showWebCamera && isWeb && (
        <WebCamera
          onCapture={handleWebCameraCapture}
          onClose={() => setShowWebCamera(false)}
        />
      )}

      {Platform.OS === 'web' ? (
        // Web version - Show upload options
        <View style={{ flex: 1, backgroundColor: COLORS.white, paddingTop: 60 }}>
          <View style={{ paddingHorizontal: 24, paddingBottom: 24, backgroundColor: COLORS.primary, borderBottomWidth: 4, borderBottomColor: COLORS.blue[600] }}>
            <Text style={{ color: COLORS.white, fontSize: 28, fontWeight: '700', marginBottom: 8 }}>
              画像をアップロード
            </Text>
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '500' }}>
              描いた絵を選択してください
            </Text>
          </View>

          <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
            <View style={{ maxWidth: 500, alignSelf: 'center', width: '100%' }}>
              {/* Camera Button */}
              <TouchableOpacity
                onPress={capture}
                disabled={loading}
                style={{
                  backgroundColor: COLORS.secondary,
                  paddingVertical: 20,
                  paddingHorizontal: 24,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  shadowColor: COLORS.secondary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Camera color={COLORS.white} size={24} strokeWidth={2.5} />
                <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', marginLeft: 12 }}>
                  {loading ? '読み込み中...' : 'カメラで撮影'}
                </Text>
              </TouchableOpacity>

              {/* Local Gallery Button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('LocalGallery')}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 20,
                  paddingHorizontal: 24,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <FolderOpen color={COLORS.white} size={24} strokeWidth={2.5} />
                <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', marginLeft: 12 }}>
                  サンプル画像から選ぶ
                </Text>
              </TouchableOpacity>

              {/* File Upload Button */}
              <TouchableOpacity
                onPress={onPickFromFiles}
                disabled={loading}
                style={{
                  backgroundColor: COLORS.accent,
                  paddingVertical: 20,
                  paddingHorizontal: 24,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: COLORS.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Upload color={COLORS.white} size={24} strokeWidth={2.5} />
                <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', marginLeft: 12 }}>
                  {loading ? '読み込み中...' : 'ファイルから選ぶ'}
                </Text>
              </TouchableOpacity>

              {/* Info Box */}
              <View style={{ backgroundColor: COLORS.blue[50], borderRadius: 12, padding: 16, marginTop: 24, borderLeftWidth: 4, borderLeftColor: COLORS.primary }}>
                <Text style={{ color: COLORS.gray[700], fontSize: 14, fontWeight: '500', lineHeight: 20 }}>
                  💡 ヒント: 子供が描いた絵をアップロードして、AIキャラクターを作成しましょう！
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // Mobile version - Show camera
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
        >
          {isSimulator && (
            <View style={{ position: 'absolute', top: 50, left: 16, right: 16, backgroundColor: COLORS.sunnyYellow, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderColor: COLORS.brightBlue }}>
              <Text style={{ color: COLORS.brightBlue, fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>シミュレーターでは カメラが つかえません。きいろい フォルダボタンを おしてね！</Text>
            </View>
          )}
          <View style={{ position: 'absolute', top: isSimulator ? 120 : 60, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{ backgroundColor: COLORS.sunnyYellow, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 3, borderColor: COLORS.white, flexDirection: 'row', alignItems: 'center' }}>
              <Sparkles color={COLORS.brightBlue} size={20} />
              <Text style={{ color: COLORS.brightBlue, fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>しゅくだいを うつしてね</Text>
              <Sparkles color={COLORS.brightBlue} size={20} marginLeft={8} />
            </View>
          </View>
          <View style={{ position: 'absolute', left: 24, right: 24, top: isSimulator ? 200 : 160, bottom: 180, borderWidth: 4, borderColor: COLORS.happyGreen, borderRadius: 24, borderStyle: 'dashed' }} />
        </CameraView>
      )}

      {Platform.OS !== 'web' && (
        <View style={{ position: 'absolute', bottom: 32, left: 10, right: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 16, paddingHorizontal: 8, borderRadius: 30, borderWidth: 3, borderColor: COLORS.brightBlue }}>
          <TouchableOpacity
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            style={{ backgroundColor: COLORS.softPurple, padding: 12, borderRadius: 50, borderWidth: 2, borderColor: COLORS.white }}
          >
            <FlipHorizontal color={COLORS.white} size={22} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={capture}
            style={{ backgroundColor: COLORS.coralPink, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 50, borderWidth: 3, borderColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>{busy ? 'まって…' : 'とる！'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('LocalGallery')}
            style={{ backgroundColor: COLORS.sunnyYellow, padding: 12, borderRadius: 50, borderWidth: 2, borderColor: COLORS.white }}
          >
            <FolderOpen color={COLORS.brightBlue} size={22} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPickImage}
            style={{ backgroundColor: COLORS.brightBlue, padding: 12, borderRadius: 50, borderWidth: 2, borderColor: COLORS.white }}
          >
            <ImageIcon color={COLORS.white} size={22} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPickFromFiles}
            style={{ backgroundColor: COLORS.happyGreen, padding: 12, borderRadius: 50, borderWidth: 2, borderColor: COLORS.white }}
          >
            <Upload color={COLORS.white} size={22} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 16, color: COLORS.gray[700], fontSize: 20, fontWeight: '600' }}>AI が処理しています…</Text>
          <Sparkles color={COLORS.accent} size={40} style={{ marginTop: 12 }} />
        </View>
      )}
    </View>
  );
}

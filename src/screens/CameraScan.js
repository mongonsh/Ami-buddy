import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../theme/colors';
import * as ImagePicker from 'expo-image-picker';

export default function CameraScan({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('choice');

  if (mode === 'choice') {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: COLORS.navy, fontSize: 22, marginBottom: 24 }}>えらんでね</Text>
        <TouchableOpacity
          onPress={() => setMode('camera')}
          style={{ backgroundColor: COLORS.navy, paddingVertical: 16, paddingHorizontal: 28, borderRadius: 28, marginBottom: 16, width: '100%', alignItems: 'center' }}
        >
          <Text style={{ color: COLORS.cream, fontSize: 18 }}>ライブカメラ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.9
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              navigation.navigate('Result', { imageUri: result.assets[0].uri });
            }
          }}
          style={{ backgroundColor: COLORS.olive, paddingVertical: 16, paddingHorizontal: 28, borderRadius: 28, width: '100%', alignItems: 'center' }}
        >
          <Text style={{ color: COLORS.cream, fontSize: 18 }}>しゃしんを アップロード</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.navy, fontSize: 18 }}>カメラを よういしています…</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.navy, fontSize: 18, marginBottom: 12 }}>カメラの きょかが ひつようです</Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: COLORS.navy, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 }}
        >
          <Text style={{ color: COLORS.cream, fontSize: 18 }}>きょかする</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const capture = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      navigation.navigate('Result', { imageUri: photo.uri });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.black }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
      >
        <View style={{ position: 'absolute', top: 32, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ backgroundColor: 'rgba(255,253,208,0.85)', color: COLORS.navy, fontSize: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
            カメラに しゅくだいを うつしてね
          </Text>
        </View>
        <View style={{ position: 'absolute', left: 32, right: 32, top: 120, bottom: 140, borderWidth: 3, borderColor: COLORS.olive, borderRadius: 18 }} />
      </CameraView>
      <View style={{ position: 'absolute', bottom: 28, left: 0, right: 0, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={capture}
          style={{ backgroundColor: COLORS.navy, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 28 }}
        >
          <Text style={{ color: COLORS.cream, fontSize: 20 }}>{busy ? 'まっています…' : 'シャッター'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('choice')}
          style={{ marginTop: 10, backgroundColor: COLORS.olive, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 }}
        >
          <Text style={{ color: COLORS.cream, fontSize: 16 }}>もどる</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

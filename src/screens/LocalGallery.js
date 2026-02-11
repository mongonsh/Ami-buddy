import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Alert, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { COLORS } from '../theme/colors';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const imageWidth = (width - 60) / 2;

const isWeb = Platform.OS === 'web';

// Import all images from project folders
const LOCAL_IMAGES = isWeb ? [
  // Web: Use direct paths to public folder
  { id: 1, uri: '/drawings/drawing1.jpeg', name: 'Drawing 1' },
  { id: 2, uri: '/drawings/drawing2.jpeg', name: 'Drawing 2' },
  { id: 3, uri: '/drawings/drawing3.jpeg', name: 'Drawing 3' },
  { id: 4, uri: '/drawings/amybuddy.png', name: 'AmyBuddy' },
  { id: 5, uri: '/homeworks/image.png', name: 'Homework' },
] : [
  // Mobile: Use require()
  { id: 1, source: require('../../public/drawings/drawing1.jpeg'), name: 'Drawing 1' },
  { id: 2, source: require('../../public/drawings/drawing2.jpeg'), name: 'Drawing 2' },
  { id: 3, source: require('../../public/drawings/drawing3.jpeg'), name: 'Drawing 3' },
  { id: 4, source: require('../../public/drawings/amybuddy.png'), name: 'AmyBuddy' },
  { id: 5, source: require('../../public/homeworks/image.png'), name: 'Homework' },
];

export default function LocalGallery({ navigation }) {
  const handleImageSelect = async (image) => {
    try {
      let uri;
      
      if (isWeb) {
        // Web: Use direct URI
        uri = image.uri;
      } else {
        // Mobile: Resolve asset
        uri = Image.resolveAssetSource(image.source)?.uri;
        if (!uri) {
          const asset = Asset.fromModule(image.source);
          if (!asset.downloaded) {
            await asset.downloadAsync();
          }
          uri = asset.localUri || asset.uri;
        }
      }

      if (!uri) {
        Alert.alert('エラー', '画像を読み込めませんでした');
        return;
      }

      navigation.navigate('CharacterCreation', { imageUri: uri });
    } catch (error) {
      console.error('Local gallery select error:', error);
      Alert.alert('エラー', '画像を読み込めませんでした');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, backgroundColor: COLORS.primary, borderBottomWidth: 4, borderBottomColor: COLORS.blue[600] }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
        >
          <ArrowLeft color={COLORS.white} size={24} strokeWidth={2.5} />
          <Text style={{ color: COLORS.white, fontSize: 18, marginLeft: 8, fontWeight: '600' }}>戻る</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ImageIcon color={COLORS.white} size={28} strokeWidth={2.5} />
          <Text style={{ color: COLORS.white, fontSize: 28, fontWeight: '700', marginLeft: 12 }}>
            画像を選択
          </Text>
        </View>
      </View>

      {/* Gallery Grid */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {LOCAL_IMAGES.map((image) => (
            <TouchableOpacity
              key={image.id}
              onPress={() => handleImageSelect(image)}
              style={{
                width: imageWidth,
                height: imageWidth,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: COLORS.gray[100],
                borderWidth: 2,
                borderColor: COLORS.gray[200],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3
              }}
            >
              <Image
                source={isWeb ? { uri: image.uri } : image.source}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(37, 99, 235, 0.9)',
                paddingVertical: 8,
                paddingHorizontal: 8
              }}>
                <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                  {image.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {LOCAL_IMAGES.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <ImageIcon color={COLORS.gray[400]} size={64} strokeWidth={2} />
            <Text style={{ color: COLORS.gray[600], fontSize: 18, marginTop: 16, textAlign: 'center', fontWeight: '500' }}>
              画像がありません
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

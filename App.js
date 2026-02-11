import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import VideoSplashScreen from './src/components/VideoSplashScreen';
import { COLORS } from './src/theme/colors';

const isWeb = Platform.OS === 'web';

export default function App() {
  const [showSplash, setShowSplash] = useState(!isWeb); // Disable splash on web
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // Prepare app resources
    async function prepare() {
      try {
        // Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Show splash only on mobile
  if (!appIsReady || (showSplash && !isWeb)) {
    return <VideoSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </SafeAreaView>
  );
}

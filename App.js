import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, Platform, View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import VideoSplashScreen from './src/components/VideoSplashScreen';
import { COLORS } from './src/theme/colors';

const isWeb = Platform.OS === 'web';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import LandingPage from './src/screens/LandingPage';
import LoginScreen from './src/screens/LoginScreen';

const Main = () => {
  const { user, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(Platform.OS === 'web');

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (user) {
    return <AppNavigator />;
  }

  if (showLanding && Platform.OS === 'web') {
    return <LandingPage navigation={{ navigate: () => setShowLanding(false) }} />;
  }

  return <LoginScreen />;
};



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
  if (!isWeb && (!appIsReady || showSplash)) {
    return <VideoSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <AuthProvider>
      <LanguageProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <StatusBar barStyle="dark-content" />
          <Main />
        </SafeAreaView>
      </LanguageProvider>
    </AuthProvider>
  );
}

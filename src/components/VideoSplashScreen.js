import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { COLORS } from '../theme/colors';

export default function VideoSplashScreen({ onFinish }) {
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const videoRef = useRef(null);

  const handlePlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      // Video finished, fade out and call onFinish
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }
  };

  useEffect(() => {
    // Auto-play video when component mounts
    if (videoRef.current && isReady) {
      videoRef.current.playAsync();
    }
  }, [isReady]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Video
        ref={videoRef}
        source={require('../../assets/loadingvideo.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        isLooping={false}
        onLoad={() => setIsReady(true)}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        volume={1.0}
        isMuted={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

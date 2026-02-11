import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';
import { COLORS } from '../theme/colors';

export default function AnimatedCharacter({ imageUri, size = 80, isSpeaking = false }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSpeaking) {
      // Bounce animation
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );

      // Scale animation (breathing effect)
      const scale = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );

      // Slight rotation (head movement)
      const rotate = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );

      bounce.start();
      scale.start();
      rotate.start();

      return () => {
        bounce.stop();
        scale.stop();
        rotate.stop();
        bounceAnim.setValue(0);
        scaleAnim.setValue(1);
        rotateAnim.setValue(0);
      };
    } else {
      // Reset animations when not speaking
      bounceAnim.setValue(0);
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [isSpeaking]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: COLORS.white,
        borderWidth: 3,
        borderColor: isSpeaking ? COLORS.sunnyYellow : COLORS.brightBlue,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        transform: [
          { translateY: bounceAnim },
          { scale: scaleAnim },
          { rotate: rotateInterpolate },
        ],
      }}
    >
      <Image
        source={{ uri: imageUri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
      
      {/* Speaking indicator - pulsing glow */}
      {isSpeaking && (
        <Animated.View
          style={{
            position: 'absolute',
            top: -3,
            left: -3,
            right: -3,
            bottom: -3,
            borderRadius: size / 2,
            borderWidth: 3,
            borderColor: COLORS.sunnyYellow,
            opacity: scaleAnim.interpolate({
              inputRange: [1, 1.1],
              outputRange: [0.3, 0.8],
            }),
          }}
        />
      )}
    </Animated.View>
  );
}

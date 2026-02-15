import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Image, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    useAnimatedStyle,
    Easing
} from 'react-native-reanimated';

/**
 * LiveBuddy Component
 * Renders a segmented character using standard React Native Views for maximum compatibility.
 * Replaces Skia implementation to avoid Web WASM/Context crashes.
 */
// Load images hooks - not using Skia useImage anymore, just passing URIs to Image
// But we need to check if they exist to render

const LiveBuddy = ({ partUrls, rigData, speaking, emotion }) => {
    // Animation State Breathing (Scale)
    const mouthOpen = useSharedValue(0);
    const headRotation = useSharedValue(0);
    const headY = useSharedValue(0);
    const armRotation = useSharedValue(0);
    const bodyScale = useSharedValue(1);

    // 1. Idle Breathing (Scale)
    useEffect(() => {
        bodyScale.value = withRepeat(
            withSequence(
                withTiming(1.02, { duration: 2000, easing: Easing.ease }),
                withTiming(1, { duration: 2000, easing: Easing.ease })
            ),
            -1,
            true
        );
    }, []);

    // 2. Head & Arm Idle Sway
    useEffect(() => {
        if (!speaking) {
            // Web safe idle animation
            headRotation.value = withRepeat(
                withTiming(0.02, { duration: 3000, easing: Easing.ease }),
                -1,
                true
            );
            armRotation.value = withRepeat(
                withTiming(0.05, { duration: 4000, easing: Easing.ease }),
                -1,
                true
            );
        }
    }, [speaking]);

    // 3. Speaking Animation
    useEffect(() => {
        if (speaking) {
            // Mouth / Jaw
            mouthOpen.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 150 }),
                    withTiming(0, { duration: 150 })
                ),
                -1,
                true
            );

            // Head Bob
            headY.value = withRepeat(
                withSequence(
                    withTiming(5, { duration: 200 }),
                    withTiming(0, { duration: 200 })
                ),
                -1,
                true
            );

            // Gestures
            armRotation.value = withRepeat(
                withSequence(
                    withTiming(-0.3, { duration: 500 }),
                    withTiming(0, { duration: 500 }),
                    withTiming(0, { duration: 2000 })
                ),
                -1,
                true
            );
        } else {
            mouthOpen.value = withTiming(0);
            headY.value = withTiming(0);
        }
    }, [speaking]);

    // 4. Emotions
    useEffect(() => {
        if (emotion === 'happy' || emotion === 'wave') {
            armRotation.value = withSequence(
                withTiming(-0.8, { duration: 300 }),
                withRepeat(
                    withTiming(-0.4, { duration: 300 }),
                    4,
                    true
                ),
                withTiming(0, { duration: 500 })
            );
        }
    }, [emotion]);

    // Animated Styles
    const bodyStyle = useAnimatedStyle(() => ({
        transform: [{ scale: bodyScale.value }]
    }));

    const headStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: headY.value },
            { rotate: `${headRotation.value}rad` },
            { scaleY: 1 + mouthOpen.value * 0.05 } // Jaw simulation
        ]
    }));

    const leftArmStyle = useAnimatedStyle(() => ({
        // Simple rotation for left arm (idle mostly)
        transform: [{ rotate: `${-armRotation.value * 0.5}rad` }]
    }));

    const rightArmStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${armRotation.value}rad` }]
    }));


    if (!partUrls?.body || !partUrls?.head) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#999" />
                <Text style={styles.loadingText}>Loading Character...</Text>
            </View>
        );
    }

    // Layout Constants
    const CONTAINER_SIZE = 300;

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.characterWrapper, bodyStyle]}>

                {/* 0. LEGS Layer (Behind Body) */}
                {partUrls.left_leg && (
                    <Animated.View style={[styles.absoluteFill, styles.leg, { transform: [{ rotate: '5deg' }, { translateX: -20 }, { translateY: 50 }] }]}>
                        <Image
                            source={{ uri: partUrls.left_leg }}
                            style={styles.fullSizeImage}
                            resizeMode="contain"
                        />
                    </Animated.View>
                )}
                {partUrls.right_leg && (
                    <Animated.View style={[styles.absoluteFill, styles.leg, { transform: [{ rotate: '-5deg' }, { translateX: 20 }, { translateY: 50 }] }]}>
                        <Image
                            source={{ uri: partUrls.right_leg }}
                            style={styles.fullSizeImage}
                            resizeMode="contain"
                        />
                    </Animated.View>
                )}

                {/* 1. BODY (Base Layer) */}
                <Image
                    source={{ uri: partUrls.body }}
                    style={styles.fullSizeImage}
                    resizeMode="contain"
                />

                {/* 2. HEAD Layer 
                    Positioning: Try to overlay on top. 
                    Since we don't have exact pivot coordinates from rigData easily mapable to absolute View layout 
                    without complex math, we assume standard 'paper doll' stacking.
                    We use absolute positioning to stack them.
                */}
                <Animated.View style={[styles.absoluteFill, headStyle]}>
                    <Image
                        source={{ uri: partUrls.head }}
                        style={styles.fullSizeImage}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* 3. ARMS Layer */}
                {partUrls.left_arm && (
                    <Animated.View style={[styles.absoluteFill, leftArmStyle]}>
                        <Image
                            source={{ uri: partUrls.left_arm }}
                            style={styles.fullSizeImage}
                            resizeMode="contain"
                        />
                    </Animated.View>
                )}

                {partUrls.right_arm && (
                    <Animated.View style={[styles.absoluteFill, rightArmStyle]}>
                        <Image
                            source={{ uri: partUrls.right_arm }}
                            style={styles.fullSizeImage}
                            resizeMode="contain"
                        />
                    </Animated.View>
                )}

            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '#eee', // Debug bg
    },
    characterWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    fullSizeImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingContainer: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 12
    },
    loadingText: {
        fontSize: 12,
        color: '#888',
        marginTop: 8
    }
});

export default LiveBuddy;

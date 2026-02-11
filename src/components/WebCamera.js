import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Camera, X, RotateCw } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

export default function WebCamera({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setStream(mediaStream);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('カメラにアクセスできません。ブラウザの設定を確認してください。');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        stopCamera();
        onCapture(url);
      }
      setCapturing(false);
    }, 'image/jpeg', 0.95);
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Video Preview */}
      <video
        ref={videoRef}
        style={styles.video}
        autoPlay
        playsInline
        muted
      />

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* Close Button */}
        <TouchableOpacity
          onPress={() => {
            stopCamera();
            onClose();
          }}
          style={styles.closeButton}
        >
          <X color={COLORS.white} size={24} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Capture Button */}
        <TouchableOpacity
          onPress={capturePhoto}
          disabled={capturing || !!error}
          style={[styles.captureButton, (capturing || error) && styles.captureButtonDisabled]}
        >
          <Camera color={COLORS.white} size={32} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Switch Camera Button */}
        <TouchableOpacity
          onPress={switchCamera}
          style={styles.switchButton}
        >
          <RotateCw color={COLORS.white} size={24} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          📸 カメラで絵を撮影してください
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.gray[900],
    zIndex: 1000,
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  errorContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -50 }],
    backgroundColor: COLORS.red[500],
    padding: 20,
    borderRadius: 12,
  },
  errorText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  closeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray[700],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  captureButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0,
  },
  switchButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray[700],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  instructions: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
  },
  instructionsText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

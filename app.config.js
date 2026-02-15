import 'dotenv/config';

export default {
  expo: {
    name: "AmiBuddy",
    slug: "amibuddy",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./logo.png",
    splash: {
      image: "./logo.png",
      resizeMode: "contain",
      backgroundColor: "#87CEEB"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*", "assets/**/*"],
    ios: {
      supportsTablet: true,
      icon: "./logo.png",
      infoPlist: {
        NSCameraUsageDescription: "AmiBuddy needs camera access to scan your homework drawings",
        NSMicrophoneUsageDescription: "AmiBuddy needs microphone access for voice features",
        NSPhotoLibraryUsageDescription: "AmiBuddy needs photo library access to select images from your computer"
      }
    },
    android: {
      icon: "./logo.png",
      adaptiveIcon: {
        foregroundImage: "./logo.png",
        backgroundColor: "#87CEEB"
      },
      permissions: [
        "RECORD_AUDIO",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "Allow AmiBuddy to access your photos from computer"
        }
      ],
      "expo-localization"
    ],
    web: {
      bundler: "metro",
      favicon: "./logo.png",
      name: "AmiBuddy - AI Homework Companion",
      shortName: "AmiBuddy",
      description: "Bring your drawings to life and learn with AI! AmiBuddy turns your homework into interactive animated characters.",
      themeColor: "#87CEEB",
      startUrl: "/",
      display: "standalone",
      backgroundColor: "#ffffff",
      meta: {
        viewport: "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover",
        "og:title": "AmiBuddy - AI Homework Companion",
        "og:description": "Bring your drawings to life and learn with AI! AmiBuddy turns your homework into interactive animated characters.",
        "og:type": "website",
        "og:image": "/logo.png",
        "twitter:card": "summary",
        "twitter:title": "AmiBuddy - AI Homework Companion",
        "twitter:description": "Bring your drawings to life and learn with AI! AmiBuddy turns your homework into interactive animated characters.",
        "twitter:image": "/logo.png"
      }
    },
    extra: {
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID,
      ELEVENLABS_MODEL_ID: process.env.ELEVENLABS_MODEL_ID,
      MEMU_API_KEY: process.env.MEMU_API_KEY,
      MEMU_USER_ID: process.env.MEMU_USER_ID,
      MEMU_AGENT_ID: process.env.MEMU_AGENT_ID,
      MEMU_BASE_URL: process.env.MEMU_BASE_URL,
      SAM_API_URL: process.env.SAM_API_URL,
      SAM_API_KEY: process.env.SAM_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      ANIMATION_API_URL: process.env.ANIMATION_API_URL
    }
  }
};

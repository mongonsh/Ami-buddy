// src/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Helper to getenv or default (for development safety)
// Ideally these should come from your .env via process.env
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exports
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Auth with Persistence
let auth;
if (getApps().length > 0) {
    auth = getAuth(app);
} else {
    try {
        console.log('Initializing Auth Persistence...');
        // Debug logs
        if (!ReactNativeAsyncStorage) {
            console.error('ReactNativeAsyncStorage is undefined! Check imports.');
        } else {
            console.log('ReactNativeAsyncStorage loaded.');
        }

        if (ReactNativeAsyncStorage) {
            const persistence = getReactNativePersistence(ReactNativeAsyncStorage);
            auth = initializeAuth(app, {
                persistence: persistence
            });
            console.log('Auth initialized with persistence');
        } else {
            throw new Error("AsyncStorage unavailable");
        }
    } catch (e) {
        console.warn("Auth initialization fallback (persistence failed):", e);
        auth = getAuth(app);
    }
}
export { auth };

// Initialize Firestore with settings for better React Native connectivity
let db;
try {
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    }, 'amibuddy'); // Specify custom database ID
} catch (error) {
    // If already initialized (e.g. hot reload), just get the existing instance
    db = getFirestore(app, 'amibuddy');
}

export { db };
export const storage = getStorage(app);
export default app;

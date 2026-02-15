// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import Layout from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const { t, changeLanguage, locale } = useLanguage();

    const handleAuth = async () => {
        setError(''); // Clear previous errors
        if (!email || !password) {
            setError(locale === 'en' ? 'Please enter email and password' : 'メールアドレスとパスワードを入力してください');
            return;
        }
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Create initial user doc
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email: email,
                    createdAt: new Date(),
                    homeworkCount: 0,
                    isPremium: false,
                    language: locale
                });
            }
        } catch (error) {
            console.error("Auth error:", error);
            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') {
                msg = locale === 'en' ? 'Email already in use' : 'このメールアドレスは既に使用されています';
            } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                msg = locale === 'en' ? 'Invalid email or password' : 'メールアドレスまたはパスワードが間違っています';
            } else if (error.code === 'auth/weak-password') {
                msg = locale === 'en' ? 'Password should be at least 6 characters' : 'パスワードは6文字以上にしてください';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymous = async () => {
        setError('');
        setLoading(true);
        try {
            const userCredential = await signInAnonymously(auth);
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                isAnonymous: true,
                createdAt: new Date(),
                homeworkCount: 0,
                isPremium: false,
                language: locale
            });
        } catch (error) {
            console.error("Anonymous auth error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>AmiBuddy</Text>
                <Text style={styles.subtitle}>{isLogin ? t('login') : t('signup')}</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {loading ? (
                    <ActivityIndicator size="large" color="#6200ea" style={styles.loader} />
                ) : (
                    <>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
                            <Text style={styles.primaryButtonText}>
                                {isLogin ? t('login') : t('signup')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
                            <Text style={styles.switchText}>
                                {isLogin ? "New here? Create Account" : "Already have an account? Login"}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.secondaryButton} onPress={handleAnonymous}>
                            <Text style={styles.secondaryButtonText}>Try Guest Mode</Text>
                        </TouchableOpacity>
                    </>
                )}

                <View style={styles.langSwitch}>
                    <TouchableOpacity onPress={() => changeLanguage('en')} style={[styles.langBtn, locale === 'en' && styles.activeLang]}>
                        <Text style={[styles.langText, locale === 'en' && styles.activeLangText]}>EN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeLanguage('jp')} style={[styles.langBtn, locale === 'jp' && styles.activeLang]}>
                        <Text style={[styles.langText, locale === 'jp' && styles.activeLangText]}>JP</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)', // Glassmorphism-ish
        borderRadius: 20,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#6200ea',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 30,
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    primaryButton: {
        width: '100%',
        backgroundColor: '#6200ea',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#6200ea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchButton: {
        padding: 10,
    },
    switchText: {
        color: '#6200ea',
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: '#eee',
        marginVertical: 20
    },
    secondaryButton: {
        padding: 10,
    },
    secondaryButtonText: {
        color: '#888',
        fontSize: 14
    },
    loader: {
        marginVertical: 20
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 14,
        marginBottom: 15,
        textAlign: 'center',
    },
    langSwitch: {
        flexDirection: 'row',
        marginTop: 20,
        backgroundColor: '#eee',
        borderRadius: 20,
        padding: 4
    },
    langBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16
    },
    activeLang: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    langText: {

    },
    activeLangText: {
        fontWeight: 'bold',
        color: '#6200ea'
    }
});

export default LoginScreen;

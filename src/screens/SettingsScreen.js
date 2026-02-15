// src/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, TextInput } from 'react-native';
import Layout from '../components/Layout';
import { COLORS } from '../theme/colors';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogOut, User, Volume2, Save, ChevronLeft, Globe } from 'lucide-react-native';

export default function SettingsScreen({ navigation }) {
    const { userData, refreshUserData } = useAuth();
    const { locale, changeLanguage, t } = useLanguage();
    const [name, setName] = useState('');
    const [voiceType, setVoiceType] = useState('female'); // 'female' | 'male'
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (userData) {
            setName(userData.displayName || '');
            setVoiceType(userData.voiceType || 'female');
        }
    }, [userData]);

    const handleSave = async () => {
        if (!auth.currentUser) return;
        setSaving(true);
        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                displayName: name,
                voiceType: voiceType,
                updatedAt: new Date()
            });
            await refreshUserData();
            Alert.alert('Success', 'Profile updated!');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // Navigation will automatically handle this via onAuthStateChanged in App.js
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    return (
        <Layout style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={COLORS.navy} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings')}</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile')}</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('name')}</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder={t('namePlaceholder')}
                                placeholderTextColor={COLORS.gray[400]}
                            />
                        </View>
                    </View>
                </View>

                {/* Voice Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('voiceSettings')}</Text>
                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Volume2 color={COLORS.gray[700]} size={20} />
                                <Text style={styles.settingLabel}>{t('voiceType')}</Text>
                            </View>
                            <View style={styles.voiceOptions}>
                                <TouchableOpacity
                                    style={[styles.voiceOption, voiceType === 'female' && styles.voiceOptionSelected]}
                                    onPress={() => setVoiceType('female')}
                                >
                                    <Text style={[styles.voiceText, voiceType === 'female' && styles.voiceTextSelected]}>{t('female')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.voiceOption, voiceType === 'male' && styles.voiceOptionSelected]}
                                    onPress={() => setVoiceType('male')}
                                >
                                    <Text style={[styles.voiceText, voiceType === 'male' && styles.voiceTextSelected]}>{t('male')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Language Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('language')}</Text>
                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Globe color={COLORS.gray[700]} size={20} />
                                <Text style={styles.settingLabel}>{t('languageLabel')}</Text>
                            </View>
                            <View style={styles.voiceOptions}>
                                <TouchableOpacity
                                    style={[styles.voiceOption, locale === 'jp' && styles.voiceOptionSelected]}
                                    onPress={() => changeLanguage('jp')}
                                >
                                    <Text style={[styles.voiceText, locale === 'jp' && styles.voiceTextSelected]}>日本語</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.voiceOption, locale === 'en' && styles.voiceOptionSelected]}
                                    onPress={() => changeLanguage('en')}
                                >
                                    <Text style={[styles.voiceText, locale === 'en' && styles.voiceTextSelected]}>English</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Save color={COLORS.white} size={20} />
                    <Text style={styles.saveButtonText}>{saving ? t('saving') : t('save')}</Text>
                </TouchableOpacity>

                {/* Sign Out */}
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <LogOut color={COLORS.red[500]} size={20} />
                    <Text style={styles.signOutText}>{t('signOut')}</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.navy,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.gray[600],
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.gray[700],
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.gray[200],
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: COLORS.gray[50],
        color: COLORS.gray[900],
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingLabel: {
        fontSize: 16,
        color: COLORS.gray[800],
        fontWeight: '500',
    },
    voiceOptions: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray[100],
        borderRadius: 8,
        padding: 2,
    },
    voiceOption: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    voiceOptionSelected: {
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    voiceText: {
        fontSize: 13,
        color: COLORS.gray[500],
        fontWeight: '500',
    },
    voiceTextSelected: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.red[100],
        backgroundColor: COLORS.red[50],
        gap: 8,
        marginBottom: 32,
    },
    signOutText: {
        color: COLORS.red[600],
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        color: COLORS.gray[400],
        fontSize: 12,
    }
});

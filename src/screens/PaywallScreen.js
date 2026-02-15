// src/screens/PaywallScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import Layout from '../components/Layout';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { Crown, Check } from 'lucide-react-native';

import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// Hardcode API URL for now or get from env
const API_URL = 'https://animation-orchestrator-448060856461.asia-northeast1.run.app';

export default function PaywallScreen({ navigation }) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(false);

    const handlePurchase = async () => {
        setLoading(true);
        // Mock payment process - Simulate Coming Soon
        setTimeout(() => {
            setLoading(false);
            setShowComingSoon(true);
        }, 1000);
    };

    if (showComingSoon) {
        return (
            <Layout style={styles.container}>
                <View style={[styles.content, { justifyContent: 'center' }]}>
                    <Crown size={80} color={COLORS.gray[300]} />
                    <Text style={[styles.title, { marginTop: 24 }]}>{t('comingSoon') || 'Coming Soon!'}</Text>
                    <Text style={[styles.description, { textAlign: 'center', color: COLORS.gray[600], marginTop: 12, marginBottom: 32 }]}>
                        {t('premiumComingSoon') || 'Premium features are currently under development. Stay tuned for updates!'}
                    </Text>
                    <TouchableOpacity
                        style={styles.buyButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.buyButtonText}>{t('goBack') || 'Go Back'}</Text>
                    </TouchableOpacity>
                </View>
            </Layout>
        );
    }

    return (
        <Layout style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Crown size={60} color={COLORS.sunnyYellow} fill={COLORS.sunnyYellow} />
                    <Text style={styles.title}>{t('upgradeTitle')}</Text>
                    <Text style={styles.price}>$2.99 / one-time</Text>
                </View>

                <View style={styles.featuresList}>
                    <FeatureItem text={t('featureUnlimited')} />
                    <FeatureItem text={t('featureMagic')} />
                    <FeatureItem text={t('featureVoice')} />
                    <FeatureItem text={t('featureSupport')} />
                </View>

                <TouchableOpacity
                    style={styles.buyButton}
                    onPress={handlePurchase}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buyButtonText}>{t('upgradeNow')}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>{t('maybeLater')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </Layout>
    );
}

const FeatureItem = ({ text }) => (
    <View style={styles.featureItem}>
        <View style={styles.checkCircle}>
            <Check size={16} color="white" />
        </View>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.navy,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    price: {
        fontSize: 24,
        fontWeight: '600',
        color: COLORS.primary,
    },
    featuresList: {
        width: '100%',
        marginBottom: 40,
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: 'rgba(255,255,255,0.6)',
        padding: 16,
        borderRadius: 12,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.green[500],
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontSize: 16,
        color: COLORS.gray[800],
        fontWeight: '500',
    },
    buyButton: {
        width: '100%',
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: 16,
    },
    buyButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 12,
    },
    closeButtonText: {
        color: COLORS.gray[500],
        fontSize: 16,
        fontWeight: '500',
    },
});

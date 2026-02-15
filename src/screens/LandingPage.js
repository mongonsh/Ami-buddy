import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../theme/colors';
import { Mic, BookOpen, Star, Shield, ArrowRight, Languages } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function LandingPage({ navigation }) {
    const { t, changeLanguage, locale } = useLanguage();

    const navigateToApp = () => {
        navigation.navigate('Login');
    };

    return (
        <View style={styles.container}>
            {/* Navbar */}
            <View style={styles.navbar}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>
                <View style={styles.navActions}>
                    <TouchableOpacity
                        style={styles.langButton}
                        onPress={() => changeLanguage(locale === 'en' ? 'jp' : 'en')}
                    >
                        <Languages size={20} color={COLORS.primary} />
                        <Text style={styles.langText}>{locale === 'en' ? 'English' : '日本語'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={navigateToApp}>
                        <Text style={styles.navButtonText}>{t('login') || 'Login'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <LinearGradient
                    colors={['#E0F7FA', '#F3E5F5']} // Light Blue to Light Purple
                    style={styles.heroSection}
                >
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>
                            {locale === 'en' ? 'Bring Your Drawings to Life' : 'あなたの描いた絵が動き出す'}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            {locale === 'en'
                                ? 'Upload a drawing, and watch it talk, move, and teach you English!'
                                : '絵をアップロードするだけで、キャラクターが話して、動いて、英語を教えてくれます！'}
                        </Text>
                        <TouchableOpacity style={styles.ctaButton} onPress={navigateToApp}>
                            <Text style={styles.ctaText}>
                                {locale === 'en' ? 'Try AmiBuddy Now' : 'AmiBuddyを試す'}
                            </Text>
                            <ArrowRight color="white" size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Placeholder for Hero Image - In real app, put a screenshot here */}
                    {/* <Image source={require('../../assets/hero-mockup.png')} style={styles.heroImage} resizeMode="contain" /> */}
                </LinearGradient>

                {/* Features Section */}
                <View style={styles.featuresSection}>
                    <FeatureBlock
                        imageSource={require('../../assets/images/image1.png')}
                        category="Voice AI"
                        title={locale === 'en' ? 'Interactive Voice Conversations' : 'リアルタイム音声対話'}
                        desc={locale === 'en'
                            ? 'Experience seamless conversations with your AI character. Practice pronunciation, ask questions, and learn naturally through voice interactions that feel like talking to a friend.'
                            : 'AIキャラクターと自然な会話を楽しみましょう。発音の練習や質問など、まるで友達と話しているかのように楽しく学習できます。'}
                    />
                    <FeatureBlock
                        reverse
                        imageSource={require('../../assets/images/image2.png')}
                        category="Vision AI"
                        title={locale === 'en' ? 'Smart Homework Helper' : 'スマート宿題サポート'}
                        desc={locale === 'en'
                            ? 'Stuck on a problem? Just snap a photo of your English homework. AmiBuddy analyzes it instantly and provides clear, step-by-step explanations to help you understand.'
                            : '宿題で困っていませんか？写真を撮るだけでAmiBuddyが瞬時に分析。わかりやすい解説で、答えだけでなく「なぜそうなるのか」を教えてくれます。'}
                    />
                    <FeatureBlock
                        imageSource={require('../../assets/images/image3.jpeg')}
                        category="Gamification"
                        title={locale === 'en' ? 'Gamified Learning Journey' : 'ゲーム感覚で楽しく継続'}
                        desc={locale === 'en'
                            ? 'Stay motivated with our magic card system! Earn unique rewards for every milestone you reach. Track your progress and watch your collection grow as you improve.'
                            : '学習を続けるとマジックカードがもらえます！目標を達成するたびに新しいカードをゲット。コレクションを増やしながら、楽しく英語力を伸ばしましょう。'}
                    />
                    <FeatureBlock
                        reverse
                        imageSource={require('../../assets/images/image4.png')}
                        category="Creativity"
                        title={locale === 'en' ? 'Create Your Unique Buddy' : 'あなただけの相棒を作ろう'}
                        desc={locale === 'en'
                            ? 'Draw your own character and bring it to life! Customization options allow you to create a learning partner that is truly yours, making every lesson special.'
                            : '自分で描いた絵が動き出します！オリジナルのキャラクターを作成して、世界に一つだけの学習パートナーと一緒に冒険を始めましょう。'}
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 AmiBuddy. All rights reserved.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const FeatureBlock = ({ imageSource, title, desc, category, reverse }) => {
    const isDesktop = !isMobile;
    return (
        <View style={[
            styles.featureBlock,
            isDesktop && { flexDirection: reverse ? 'row-reverse' : 'row' }
        ]}>
            <Image source={imageSource} style={styles.featureImage} resizeMode="cover" />
            <View style={styles.featureTextContainer}>
                {category && <Text style={styles.featureCategory}>{category}</Text>}
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDesc}>{desc}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    navbar: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: isMobile ? 20 : 50,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        zIndex: 10,
    },
    logoImage: {
        width: 150,
        height: 50,
    },
    navActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    langButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    langText: {
        color: COLORS.gray[600],
        fontSize: 16,
    },
    navButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    navButtonText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroSection: {
        paddingVertical: 80,
        paddingHorizontal: isMobile ? 20 : 50,
        alignItems: 'center',
    },
    heroContent: {
        maxWidth: 800,
        alignItems: 'center',
        textAlign: 'center',
    },
    heroTitle: {
        fontSize: isMobile ? 36 : 56,
        fontWeight: '800',
        color: COLORS.navy,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: isMobile ? 44 : 68,
    },
    heroSubtitle: {
        fontSize: isMobile ? 18 : 24,
        color: COLORS.gray[600],
        textAlign: 'center',
        marginBottom: 40,
        maxWidth: 600,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 50,
        gap: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    ctaText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    featuresSection: {
        paddingVertical: 100,
        paddingHorizontal: isMobile ? 20 : 50,
        backgroundColor: '#fff',
        gap: 100, // Large gap between rows
    },
    featureBlock: {
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
        alignItems: 'center',
        gap: isMobile ? 30 : 60,
        // No background/shadow for the container itself in this clean style
    },
    featureImage: {
        width: isMobile ? '100%' : '50%',
        height: isMobile ? 250 : 400,
        borderRadius: 24,
        backgroundColor: '#eee',
    },
    featureTextContainer: {
        flex: 1, // Take remaining space on desktop
        width: isMobile ? '100%' : 'auto',
        alignItems: 'flex-start', // Left align text
        justifyContent: 'center',
    },
    featureCategory: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.gray[500],
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    featureTitle: {
        fontSize: isMobile ? 28 : 42,
        fontWeight: 'bold', // In a real app we might import a Serif font here
        color: COLORS.navy,
        marginBottom: 20,
        textAlign: 'left',
        lineHeight: isMobile ? 34 : 50,
    },
    featureDesc: {
        fontSize: 18,
        color: COLORS.gray[600],
        textAlign: 'left',
        lineHeight: 30,
    },
    pricingSection: {
        paddingVertical: 80,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    sectionTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.navy,
        marginBottom: 40,
    },
    pricingCard: {
        backgroundColor: 'white',
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        maxWidth: 400,
        width: '100%',
    },
    planName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 10,
    },
    planPrice: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.navy,
        marginBottom: 20,
    },
    period: {
        fontSize: 16,
        color: COLORS.gray[500],
        fontWeight: 'normal',
    },
    planDesc: {
        fontSize: 16,
        color: COLORS.gray[600],
        marginBottom: 30,
        textAlign: 'center',
    },
    secondaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    secondaryButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        padding: 40,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    footerText: {
        color: COLORS.gray[400],
    },
});

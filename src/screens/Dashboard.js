import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { BookOpen, Sparkles, Settings } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';

export default function Dashboard({ navigation, route }) {
  const buddyImageUri = route?.params?.buddyImageUri;
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <BookOpen color={COLORS.primary} size={32} strokeWidth={2.5} />
            <Text style={styles.headerTitle}>{t('appTitle')}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
            <Settings color={COLORS.gray[600]} size={28} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerUnderline} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo/Character */}
        <View style={styles.logoContainer}>
          <View style={styles.logoShadow} />
          {buddyImageUri ? (
            <View style={styles.characterImageWrapper}>
              <Image source={{ uri: buddyImageUri }} style={styles.characterImage} />
            </View>
          ) : (
            <Image source={require('../../logo.png')} style={styles.logo} resizeMode="contain" />
          )}
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('appSubtitle')}</Text>
          <Text style={styles.subtitle}>{t('appTagline')}</Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CharacterSelection')}
            style={styles.ctaButton}
            activeOpacity={0.8}
          >
            <View style={styles.ctaButtonContent}>
              <Sparkles color={COLORS.white} size={24} strokeWidth={2.5} />
              <Text style={styles.ctaButtonText}>{t('start')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('HomeworkHistory')}
            style={[styles.ctaButton, styles.secondaryButton]}
            activeOpacity={0.8}
          >
            <View style={styles.ctaButtonContent}>
              <BookOpen color={COLORS.primary} size={24} strokeWidth={2.5} />
              <Text style={[styles.ctaButtonText, styles.secondaryButtonText]}>{t('history')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('poweredBy')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10, // Add a little bit of top padding for aesthetics inside safe area
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed from default
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gray[900],
    letterSpacing: -0.5,
  },
  headerUnderline: {
    height: 4,
    backgroundColor: COLORS.primary,
    width: 60,
    marginTop: 8,
    borderRadius: 2,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  logoShadow: {
    position: 'absolute',
    bottom: -10,
    left: '10%',
    right: '10%',
    height: 20,
    backgroundColor: COLORS.gray[200],
    borderRadius: 100,
    opacity: 0.5,
    transform: [{ scaleX: 1.2 }],
  },
  characterImageWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 4,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  logo: {
    width: 200,
    height: 200,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.gray[200],
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  ctaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  features: {
    gap: 16,
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray[400],
    fontWeight: '500',
  },
});

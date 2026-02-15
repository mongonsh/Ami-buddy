// src/screens/HomeworkHistory.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import Layout from '../components/Layout';
import { COLORS } from '../theme/colors';
import { Calendar, Clock, Star } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';

const HomeworkHistory = ({ navigation }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t, locale } = useLanguage();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!auth.currentUser) return;
            try {
                const q = query(
                    collection(db, 'users', auth.currentUser.uid, 'homeworks'),
                    orderBy('completedAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Convert Firestore timestamp to Date
                    completedAt: doc.data().completedAt?.toDate() || new Date()
                }));
                setHistory(data);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (date) => {
        return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        // "Lesson Time" -> "min" or "学習時間" -> "分" replacement hack logic
        // Ideally "min" or "minutes" key should exist.
        // For now, let's just use "min" for English and "分" for Japanese hardcoded or use a t() if I added one.
        // I didn't add a specific "minutes" key. I'll rely on locale.
        return `${mins}${locale === 'en' ? ' min' : '分'}`;
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                    <Calendar size={16} color={COLORS.gray[500]} />
                    <Text style={styles.dateText}>{formatDate(item.completedAt)}</Text>
                </View>
                {item.score && (
                    <View style={styles.scoreContainer}>
                        <Star size={16} color={COLORS.sunnyYellow} fill={COLORS.sunnyYellow} />
                        <Text style={styles.scoreText}>{item.score}{t('score')}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardContent}>
                {item.homeworkImage && (
                    <Image source={{ uri: item.homeworkImage }} style={styles.thumbnail} />
                )}
                <View style={styles.infoContainer}>
                    <Text style={styles.description} numberOfLines={2}>
                        {item.description || t('noHistory')}
                    </Text>
                    <View style={styles.metaContainer}>
                        <View style={styles.metaItem}>
                            <Clock size={14} color={COLORS.gray[500]} />
                            <Text style={styles.metaText}>{formatTime(item.durationSeconds || 0)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.characterText}>{t('withCharacter')}: {item.characterName}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {item.feedback && (
                <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackText} numberOfLines={2}>"{item.feedback}"</Text>
                </View>
            )}

            {item.magicCardUrl && (
                <View style={styles.magicCardContainer}>
                    <Text style={styles.magicCardLabel}>{t('magicCard')}</Text>
                    <Image source={{ uri: item.magicCardUrl }} style={styles.magicCardImage} resizeMode="contain" />
                </View>
            )}
        </View>
    );

    return (
        <Layout style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('learningHistory')}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('noHistory')}</Text>
                        </View>
                    }
                />
            )}
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.navy,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 14,
        color: COLORS.gray[600],
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF9C4', // Light yellow manually defined if COLORS.yellow is missing
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    scoreText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.gray[800],
    },
    cardContent: {
        flexDirection: 'row',
        gap: 12,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: COLORS.gray[100],
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    description: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.gray[800],
        marginBottom: 6,
    },
    metaContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.gray[500],
    },
    characterText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500'
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.gray[500],
    },
    feedbackContainer: {
        marginTop: 12,
        padding: 8,
        backgroundColor: COLORS.gray[50],
        borderRadius: 8
    },
    feedbackText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: COLORS.gray[600]
    },
    magicCardContainer: {
        marginTop: 12,
        alignItems: 'center',
        padding: 8,
        backgroundColor: COLORS.yellow ? COLORS.yellow[50] : '#FFFDE7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.yellow ? COLORS.yellow[200] : '#FFF59D'
    },
    magicCardLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.orange ? COLORS.orange[600] : '#F57C00',
        marginBottom: 4
    },
    magicCardImage: {
        width: 100,
        height: 140,
        borderRadius: 8
    }
});

export default HomeworkHistory;

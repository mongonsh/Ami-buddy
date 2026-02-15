// src/screens/CharacterSelection.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import Layout from '../components/Layout';
import { COLORS } from '../theme/colors';
import { Plus, User } from 'lucide-react-native';

const CharacterSelection = ({ navigation }) => {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCharacters = async () => {
            if (!auth.currentUser) return;
            try {
                const q = query(
                    collection(db, 'users', auth.currentUser.uid, 'characters'),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCharacters(data);
            } catch (error) {
                console.error("Error fetching characters:", error);
            } finally {
                setLoading(false);
            }
        };

        // Add listener for focus to refresh list when returning from creation
        const unsubscribe = navigation.addListener('focus', () => {
            fetchCharacters();
        });

        return unsubscribe;
    }, [navigation]);

    const handleSelectCharacter = (char) => {
        // Navigate to HomeworkUpload with this character's data
        navigation.navigate('HomeworkUpload', {
            characterName: char.name,
            characterImage: char.imageUri,
            characterVideo: char.videoUrl,
            rigData: char.rigData,
            partUrls: char.partUrls,
            // TODO: Voice ID
        });
    };

    const combinedData = [
        { id: 'add_new_button', isAddButton: true },
        ...characters
    ];

    const renderItem = ({ item }) => {
        if (item.isAddButton) {
            return (
                <TouchableOpacity
                    style={[styles.card, styles.addCard]}
                    onPress={() => navigation.navigate('CameraScan')}
                    activeOpacity={0.8}
                >
                    <View style={styles.addIconContainer}>
                        <Plus size={32} color={COLORS.primary} strokeWidth={3} />
                    </View>
                    <Text style={styles.addText}>あたらしくつくる</Text>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleSelectCharacter(item)}
                activeOpacity={0.8}
            >
                <Image
                    source={{ uri: item.imageUri }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
                <View style={styles.cardFooter}>
                    <Text style={styles.charName} numberOfLines={1}>{item.name}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Calculate columns based on screen width
    const screenWidth = Dimensions.get('window').width;
    const isDesktop = screenWidth > 768;
    const numColumns = isDesktop ? 4 : 2;
    const gap = 16;
    const padding = 16;

    // Explicitly calculate card width to avoid flex glitches in center-aligned container
    const availableWidth = Math.min(screenWidth, 1200) - (padding * 2) - ((numColumns - 1) * gap);
    const cardWidth = availableWidth / numColumns;

    return (
        <Layout style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>キャラクターをえらぼう</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <FlatList
                        data={combinedData}
                        renderItem={({ item }) => (
                            <View style={{ width: cardWidth, marginBottom: gap }}>
                                {renderItem({ item })}
                            </View>
                        )}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.listContent, { maxWidth: 1200, width: '100%' }]}
                        numColumns={numColumns}
                        key={numColumns} // Force re-render when columns change
                        columnWrapperStyle={{ gap: gap }}
                    />
                </View>
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
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.navy,
    },
    listContent: {
        padding: 8, // Reduced padding since cards have margin
    },
    // If gap not supported, use columnWrapperStyle

    card: {
        // Flex removed, handled by wrapper width
        backgroundColor: COLORS.white,
        borderRadius: 16,
        // Margin removed, handled by gap

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        aspectRatio: 0.8, // Taller card
        overflow: 'hidden'
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    cardFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 12,
    },
    charName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.gray[800],
        textAlign: 'center'
    },
    addCard: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.blue[50], // Light blue bg
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed'
    },
    addIconContainer: {
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 30,
        marginBottom: 12
    },
    addText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary
    }
});

export default CharacterSelection;

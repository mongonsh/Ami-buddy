// src/components/Layout.js
import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Layout = ({ children, style }) => {
    return (
        <LinearGradient
            // "Not cheap" light gradient: Soft Blue to Very Light Purple/Pink
            colors={['#E0F7FA', '#E1BEE7', '#F3E5F5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={[styles.safeArea, style]}>
                <StatusBar barStyle="dark-content" />
                {children}
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    }
});

export default Layout;

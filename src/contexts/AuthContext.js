// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null); // Firestore data

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch user data from Firestore
                await fetchUserData(currentUser.uid);
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const fetchUserData = async (uid) => {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                // Create initial user doc if not exists
                const initialData = {
                    email: auth.currentUser?.email,
                    createdAt: new Date(),
                    homeworkCount: 0,
                    isPremium: false,
                    language: 'en' // Default
                };
                await setDoc(docRef, initialData);
                setUserData(initialData);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const refreshUserData = async () => {
        if (user) {
            await fetchUserData(user.uid);
        }
    }

    return (
        <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
};

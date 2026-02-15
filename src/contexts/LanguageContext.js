// src/contexts/LanguageContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import { useAuth } from './AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Translations
const translations = {
    en: {
        welcome: 'Welcome',
        login: 'Login',
        signup: 'Sign Up',
        // Dashboard
        appTitle: 'AmiBuddy',
        appSubtitle: 'AI Homework Assistant',
        appTagline: 'Supporting your learning journey',
        start: 'Start',
        history: 'History',
        poweredBy: 'Powered by AI',
        // Settings
        settings: 'Settings',
        profile: 'Profile',
        name: 'Name',
        namePlaceholder: 'Your Name',
        voiceSettings: 'Voice Settings',
        voiceType: 'Voice Type',
        female: 'Female',
        male: 'Male',
        language: 'Language',
        languageLabel: 'Language',
        save: 'Save',
        saving: 'Saving...',
        signOut: 'Sign Out',
        // Character Creation
        createCharacter: 'Create Character',
        nameYourBuddy: 'Name your learning partner',
        nameCharacter: 'Name your learning partner', // Added for CharacterCreation.js
        characterName: 'Character Name',
        enterName: 'Enter name',
        saveAndNext: 'Save & Next',
        saveCharacter: 'Save & Next', // Added for CharacterCreation.js
        saveCharacterInfo: 'Saving your name will make the character introduce themselves.', // Added for CharacterCreation.js
        loading: 'Generating character... Please wait.',
        segmentationProcessing: 'Creating movable parts...', // New key
        animate: 'Animate!',
        // Homework Upload
        uploadHomework: 'Upload Homework',
        uploadGallery: 'Gallery',
        uploadFile: 'File',
        sampleImage: 'Sample Image',
        analyzing: 'Analyzing...',
        result: 'Result',
        topics: 'Topics',
        difficulty: 'Difficulty',
        homeworkIntro: 'Hello! Let\'s study together. Please upload a photo of your homework.',
        askQuestion: 'Ask a Question',
        recordStart: 'Record',
        recordStop: 'Stop',
        processing: 'Processing...',
        recording: 'Recording...',
        reviewHomework: 'Review Homework',
        uploadFinished: 'Upload Finished Homework',
        reviewing: 'Reviewing...',
        score: 'Score',
        strengths: 'Strengths',
        improvements: 'Improvements',
        reviewAgain: 'Review Another',
        reset: 'Select Another Homework',
        finishLesson: 'Finish Lesson',
        lessonTime: 'Lesson Time',
        // Finish Modal
        lessonFinished: 'Lesson Finished!',
        greatJob: 'Great job!',
        time: 'Time',
        magicCardEarned: 'You earned a magic card!',
        returnHome: 'Return to Home',
        // Result Screen
        errorLoadImage: 'Could not load image',
        selectImageAgain: 'Please select an image again',
        resultTitle: 'Result',
        hanamaru: 'Great Job!',
        foundCharacters: 'Found Characters',
        speaking: 'Speaking...',
        speak: 'Speak',
        saved: 'Saved!',
        savedMemory: 'Memory saved successfully',
        yourBuddy: 'Your Buddy',
        makeBuddy: 'Make Buddy',
        // History
        learningHistory: 'Learning History',
        noHistory: 'No history yet',
        withCharacter: 'With', // Added
        magicCard: 'Magic Card',
        // Common
        error: 'Error',
        errorNameRequired: 'Please enter a character name', // Added
        errorSave: 'Failed to save', // Added
        errorVoice: 'Voice playback failed', // Added
        success: 'Success',
        ok: 'OK',
        back: 'Back',
        home: 'Home',
        // Paywall
        upgradeTitle: 'Premium Plan',
        featureUnlimited: 'Unlimited Homework Uploads',
        featureMagic: 'Special Magic Cards',
        featureVoice: 'All Voice Types',
        featureSupport: 'Priority Support',
        upgradeNow: 'Upgrade Now - $5.00',
        maybeLater: 'Maybe Later',
        limitReached: 'Daily Limit Reached',
        upgradeForUnlimited: 'You have used your 5 free homeworks. Upgrade to Premium for unlimited access!',
        inspirationalMessages: [
            'Great job! You are amazing!',
            'Wonderful! I can see your effort!',
            'Awesome! You are very smart!',
            'You did it! You are a star!',
            'Wow! I am impressed by your hard work!'
        ]
    },
    jp: {
        welcome: 'ようこそ',
        login: 'ログイン',
        signup: 'サインアップ',
        // Dashboard
        appTitle: 'AmiBuddy',
        appSubtitle: 'AI宿題アシスタント',
        appTagline: 'あなたの学習をサポート',
        start: 'スタート',
        history: 'りれき',
        poweredBy: 'AIがサポート',
        // Settings
        settings: 'せってい',
        profile: 'プロフィール',
        name: 'なまえ',
        namePlaceholder: 'あなたのなまえ',
        voiceSettings: 'こえのせってい',
        voiceType: 'こえのタイプ',
        female: 'おんなのこ',
        male: 'おとこのこ',
        language: 'げんご',
        languageLabel: 'げんご',
        save: 'ほぞん',
        saving: 'ほぞんちゅう...',
        signOut: 'ログアウト',
        // Character Creation
        createCharacter: 'キャラクターをつくる',
        nameYourBuddy: 'パートナーのなまえ',
        nameCharacter: 'パートナーのなまえ', // Added for CharacterCreation.js
        characterName: 'キャラクターのなまえ',
        enterName: 'なまえをいれてね',
        saveAndNext: 'ほぞんしてつぎへ',
        saveCharacter: 'ほぞんしてつぎへ', // Added for CharacterCreation.js
        saveCharacterInfo: 'なまえをほぞんすると、キャラクターがじこしょうかいします。', // Added for CharacterCreation.js
        loading: 'キャラクターを作成中... お待ちください',
        segmentationProcessing: 'パーツを生成中...',
        animate: '動かす！',
        // Homework Upload
        uploadHomework: 'しゅくだいをアップロード',
        uploadGallery: 'ギャラリー',
        uploadFile: 'ファイル',
        sampleImage: 'サンプルがぞう',
        analyzing: 'ぶんせきちゅう...',
        result: 'けっか',
        topics: 'トピック',
        difficulty: 'むずかしさ',
        homeworkIntro: 'こんにちは！いっしょにべんきょうしましょう。しゅくだいのしゃしんをみせてください。',
        askQuestion: 'しつもんする',
        recordStart: 'ろくおんかいし',
        recordStop: 'ろくおんていし',
        processing: 'しょりちゅう...',
        recording: 'ろくおんちゅう...',
        reviewHomework: 'しゅくだいをふりかえる',
        uploadFinished: 'おわったしゅくだいをアップロード',
        reviewing: 'ふりかえりちゅう...',
        score: 'スコア',
        strengths: 'よかったところ',
        improvements: 'かいぜんてん',
        reviewAgain: 'べつのしゅくだいをふりかえる',
        reset: 'べつのしゅくだいをえらぶ',
        finishLesson: 'レッスンをかんりょう',
        lessonTime: 'レッスンじかん',
        // Finish Modal
        lessonFinished: 'レッスン しゅうりょう！',
        greatJob: 'よく がんばりました！',
        time: 'じかん',
        magicCardEarned: 'まほうのカードを ゲットしました！',
        returnHome: 'ホームに もどる',
        // Result Screen
        errorLoadImage: '画像が読み込めませんでした',
        selectImageAgain: 'もう一度画像を選んでください',
        resultTitle: '分析結果',
        hanamaru: 'はなまる！',
        foundCharacters: 'みつけた もじ',
        speaking: 'はなしています...',
        speak: 'はなす',
        saved: 'ほぞんしました！',
        savedMemory: 'おもいでを ほぞんしました',
        yourBuddy: 'あなたのバディ',
        makeBuddy: 'バディにする',
        // History
        learningHistory: 'がくしゅうりれき',
        noHistory: 'まだ りれきがありません',
        withCharacter: 'パートナー', // Added
        magicCard: '✨ 魔法のカード',
        // Common
        error: 'エラー',
        errorNameRequired: 'キャラクターの なまえを いれてください', // Added
        errorSave: 'ほぞん できませんでした', // Added
        errorVoice: 'おんせいの さ いせいに しっぱいしました', // Added
        success: '成功',
        ok: 'OK',
        back: '戻る',
        home: 'ホーム',
        // Paywall
        upgradeTitle: 'プレミアムプラン',
        featureUnlimited: 'しゅくだい アップロード しほうだい',
        featureMagic: 'とくべつな まほうのカード',
        featureVoice: 'すべての こえが つかえる',
        featureSupport: 'サポート ゆうせん',
        upgradeNow: 'アップグレード - $5.00',
        maybeLater: 'あとで',
        limitReached: 'きょうの せいげん です',
        upgradeForUnlimited: '5かいの むりょうぶんを つかいました。 プレミアムプランで むせいげんに つかえます！',
        inspirationalMessages: [
            'よくがんばりました！あなたはすごいです！',
            'すばらしい！あなたのどりょくがみえます！',
            'さいこうです！あなたはとてもかしこいです！',
            'がんばりましたね！あなたはスターです！',
            'すごい！あなたのがんばりにかんどうしました！'
        ]
    },
};

const i18n = new I18n(translations);
const LanguageContext = createContext({
    t: (key) => key,
    locale: 'en',
    changeLanguage: () => { }
});

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    // Robust locale detection
    const getSystemLocale = () => {
        try {
            const locales = Localization.getLocales();
            if (locales && locales.length > 0) {
                return locales[0].languageTag || 'en';
            }
        } catch (e) {
            console.warn("Localization detection failed", e);
        }
        return 'en';
    };

    const [locale, setLocale] = useState(getSystemLocale().split('-')[0] === 'ja' ? 'jp' : 'en');
    const { user } = useAuth();

    // Load language preference from Firestore when user logs in
    useEffect(() => {
        if (user) {
            const fetchUserLanguage = async () => {
                try {
                    const { getDoc } = require('firebase/firestore');
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.language) {
                            setLocale(userData.language);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch user language", e);
                }
            };
            fetchUserLanguage();
        }
    }, [user]);

    useEffect(() => {
        i18n.locale = locale;
        i18n.enableFallback = true;
    }, [locale]);

    const changeLanguage = async (newLocale) => {
        setLocale(newLocale);
        if (user) {
            // Persist to Firestore
            try {
                await updateDoc(doc(db, 'users', user.uid), { language: newLocale });
            } catch (e) {
                console.error("Failed to save language pref", e);
            }
        }
    };

    const t = (key) => i18n.t(key);

    return (
        <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

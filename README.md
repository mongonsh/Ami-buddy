# AmiBuddy - AI Homework Assistant for Children

An interactive React Native app that transforms children's drawings into AI-powered homework assistants. Kids create their own character, upload homework, and have voice conversations with their personalized AI buddy.

[watch demo video デモ動画ご覧ください](https://www.youtube.com/watch?v=QcsDyxEWHzc)
[![watch demo video](https://img.youtube.com/vi/QcsDyxEWHzc/maxresdefault.jpg)](https://www.youtube.com/watch?v=QcsDyxEWHzc)

## ✨ Features

### 🎬 Video Splash Screen
- Professional loading video on app start
- Smooth fade-out transition
- Auto-plays `loadingvideo.mp4`

### 🎨 Character Creation
- Upload a drawing to create a personalized AI character
- Name your character
- Character introduces itself with voice
- Animated character with bounce, breathing, and speaking effects

### 📚 Homework Analysis
- Upload homework images
- AI analyzes and explains homework in child-friendly Japanese
- Identifies topics and difficulty level
- Voice description by your character

### 🎤 Voice Conversation
- Ask questions about homework using voice
- Speech-to-text powered by Google Gemini
- AI answers in context of the homework
- Text-to-speech responses with ElevenLabs
- Conversation history with chat bubbles

### 🧠 Memory & Learning
- MemU agentic memory framework integration
- Stores character creation, homework sessions, and conversations
- Tracks learning progress and topics covered
- Retrieves relevant memories for context-aware responses

### 🎨 Child-Friendly Design
- Bright, playful color palette (sky blue, sunny yellow, coral pink, happy green)
- Large 3D buttons with shadows
- Decorative elements (stars, sparkles)
- Clear visual hierarchy
- Smooth animations

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the app
npm start

# Press 'i' for iOS simulator
```

## � How It Works

### Step 1: Create Your Character
1. Upload a drawing image
2. Enter a character name
3. Character introduces itself: "こんにちは、わたしは {name} です。しゅくだいの がぞうを いれてください。"

### Step 2: Upload Homework
1. Select homework image from gallery or files
2. AI analyzes the homework using Gemini Vision
3. Character explains the homework with voice

### Step 3: Ask Questions
1. Tap the microphone button
2. Ask questions about the homework
3. AI transcribes your voice and provides answers
4. Character speaks the answer back to you

## 🛠️ Technologies

### AI & ML
- **Google Gemini 2.5 Flash** - Vision analysis and conversation
- **ElevenLabs** - Japanese text-to-speech
- **MemU** - Agentic memory framework
- **SAM (Segment Anything)** - Drawing segmentation

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform
- **TypeScript** - Type-safe code
- **Lucide React Native** - Icon library

### Services
- Voice conversation with speech-to-text
- Image analysis with vision AI
- Memory storage and retrieval
- Character animation system

## 📂 Project Structure

```
amibuddy/
├── src/
│   ├── screens/
│   │   ├── Dashboard.js              # Home screen with logo
│   │   ├── CameraScreen.tsx          # Camera/gallery selection
│   │   ├── LocalGallery.js           # Local image gallery
│   │   ├── CharacterCreation.js      # Character naming & intro
│   │   └── HomeworkUpload.js         # Homework analysis & conversation
│   ├── components/
│   │   └── AnimatedCharacter.js      # Animated character component
│   ├── services/
│   │   ├── geminiService.ts          # Gemini vision & AI
│   │   ├── elevenLabsService.ts      # Text-to-speech
│   │   ├── voiceConversationService.ts # Speech-to-text & conversation
│   │   ├── memuService.ts            # Memory framework
│   │   └── visionService.ts          # Drawing segmentation
│   ├── navigation/
│   │   └── AppNavigator.js           # Navigation setup
│   └── theme/
│       └── colors.js                 # Color palette
├── public/
│   ├── drawings/                     # Sample drawing images
│   └── homeworks/                    # Sample homework images
├── app.config.js                     # Expo configuration
├── .env                              # Environment variables
└── package.json                      # Dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with your API keys:

```env
# ElevenLabs (Text-to-Speech)
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
ELEVENLABS_MODEL_ID=eleven_multilingual_v2

# Google Gemini (Vision & AI)
GEMINI_API_KEY=your_key_here

# MemU (Agentic Memory)
MEMU_API_KEY=your_key_here
MEMU_USER_ID=your_user_id_here
MEMU_AGENT_ID=amibuddy_homework_assistant
MEMU_BASE_URL=https://api.memu.so

# SAM (Segmentation)
SAM_API_URL=http://localhost:8000
SAM_API_KEY=your_key_here
```

### Get API Keys

- **ElevenLabs**: https://elevenlabs.io/
- **Google Gemini**: https://aistudio.google.com/app/apikey
- **MemU**: https://memu.so/
- **Hugging Face (SAM)**: https://huggingface.co/settings/tokens

## � iOS Simulator Notes

The iOS Simulator cannot access your Mac's camera. Use these alternatives:

- **Local Gallery** - View images from `public/drawings/` and `public/homeworks/`
- **Photo Library** - Select from simulator's photo library
- **File Browser** - Browse and select any image from your Mac

## 🎨 Color Palette

- **Sky Blue** (#87CEEB) - Friendly backgrounds
- **Bright Blue** (#4A90E2) - Primary elements
- **Sunny Yellow** (#FFD700) - Highlights and badges
- **Happy Green** (#32CD32) - Action buttons
- **Coral Pink** (#FF6B9D) - Secondary actions
- **Soft Purple** (#9B59B6) - Tertiary actions
- **Mint Green** (#98D8C8) - Accents

## 🧠 MemU Integration

AmiBuddy uses MemU to store and retrieve learning memories:

### What Gets Stored
- Character creation events
- Homework analysis sessions
- Voice conversation Q&A
- Learning topics and difficulty levels
- Timestamps and context

### Memory Functions
- `memorizeCharacterCreation()` - Store character data
- `memorizeHomeworkSession()` - Store homework analysis
- `memorizeConversation()` - Store Q&A exchanges
- `retrieveMemories(query)` - Retrieve relevant memories
- `getLearningSummary()` - Generate learning progress summary

### Future Enhancements
- Progress screen showing learning history
- Context-aware AI responses using past memories
- Personalized homework recommendations
- Learning pattern analysis

## 📦 Dependencies

```json
{
  "@google/generative-ai": "^0.24.1",
  "@react-navigation/native": "^6.1.11",
  "expo": "^51.0.0",
  "expo-av": "~14.0.3",
  "expo-camera": "~15.0.16",
  "expo-image-picker": "~15.1.0",
  "expo-document-picker": "~12.0.0",
  "lucide-react-native": "^0.358.0",
  "react-native": "0.75.4"
}
```

## 🎯 Key Features Summary

✅ Character creation from drawings  
✅ AI-powered homework analysis  
✅ Voice conversation with speech-to-text  
✅ Japanese text-to-speech responses  
✅ Animated character with speaking effects  
✅ Memory storage with MemU framework  
✅ Child-friendly interface design  
✅ Conversation history tracking  
✅ Topic and difficulty identification  

## 📝 License

Private project

---

Made with ❤️ for children's education

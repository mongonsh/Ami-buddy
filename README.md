# AmiBuddy - AI 子供向け宿題アシスタント

子供の落書きをAI搭載の宿題アシスタントに変える、インタラクティブな React Native アプリです。子供たちは自分だけのキャラクターを作り、宿題をアップロードし、パーソナライズされたAIの相棒と音声で会話することができます。

[デモ動画をご覧ください](https://www.youtube.com/watch?v=IoeVV8_tQiw)
[![watch demo video](https://img.youtube.com/vi/IoeVV8_tQiw/maxresdefault.jpg)](https://www.youtube.com/watch?v=IoeVV8_tQiw)

## 🏗️ アーキテクチャ (Architecture)

AmiBuddyは、React Native (Frontend) と Python/FastAPI (Backend) を組み合わせたハイブリッド構成です。

```mermaid
graph LR
    subgraph Frontend ["フロントエンド (React Native / Expo)"]
        direction TB
        MobileClient["📱 モバイルアプリ"]
        WebClient["💻 Webアプリ"]
    end

    subgraph Firebase_Services ["Firebase PaaS"]
        direction TB
        Auth["AUTH 🔐 (認証)"]
        Firestore["DB 📄 (データ)"]
        Storage["STORAGE ☁️ (画像)"]
    end

    subgraph Cloud_Run ["バックエンド (Cloud Run)"]
        direction TB
        OrchestratorAPI["🚀 APIサーバー"]
        SAM2["🧩 SAM 2 (切り抜き)"]
        RiggingAgent["🦴 リギング (骨格)"]
    end

    subgraph External_AI ["外部 AI サービス"]
        direction TB
        Gemini["✨ Gemini (視覚/推論)"]
        ElevenLabs["🗣️ ElevenLabs (音声)"]
    end

    %% Key Data Flows
    Frontend --> Auth
    Frontend --> Firestore
    Frontend --> Storage
    
    %% Direct AI Calls (Vision / Voice)
    Frontend -.->|直接呼び出し| Gemini
    Frontend -.->|直接呼び出し| ElevenLabs

    %% Heavy Processing Flow
    Frontend ==>|画像アップロード| OrchestratorAPI
    
    OrchestratorAPI --> SAM2
    OrchestratorAPI --> RiggingAgent
    RiggingAgent -.->|構造解析| Gemini

    %% Styling - HIGH CONTRAST DARK MODE
    classDef mobile fill:#0277bd,stroke:#01579b,stroke-width:2px,color:#fff;
    classDef cloud fill:#ef6c00,stroke:#e65100,stroke-width:2px,color:#fff;
    classDef ai fill:#7b1fa2,stroke:#4a148c,stroke-width:2px,color:#fff;
    classDef firebase fill:#c62828,stroke:#b71c1c,stroke-width:2px,color:#fff;

    class MobileClient,WebClient mobile;
    class OrchestratorAPI,SAM2,RiggingAgent cloud;
    class Gemini,ElevenLabs ai;
    class Auth,Firestore,Storage firebase;
```

---

## 🔄 ワークフロー (Workflows)

### 1. キャラクター作成 ("Live Animation" Pipeline)

落書きから動くキャラクターを生成するプロセスです。**Gemini** が骨格を特定し、**SAM 2** がパーツを切り抜きます。

```mermaid
sequenceDiagram
    participant User as 👤 ユーザー
    participant API as 🚀 Backend API
    participant Gemini as ✨ Gemini
    participant SAM2 as 🤖 SAM 2
    participant Storage as ☁️ Storage

    Note over User, API: 画像アップロード
    User->>Storage: 描画画像を保存
    User->>API: 解析リクエスト

    Note over API, Gemini: 構造解析
    API->>Gemini: "関節とパーツはどこ？"
    Gemini-->>API: 骨格データ (JSON)

    Note over API, SAM2: アセット生成
    loop 各パーツ
        API->>SAM2: マスク生成リクエスト
        SAM2-->>API: 高精度マスク
        API->>Storage: パーツ画像保存
    end

    API-->>User: リグデータ + パーツURL
    Note over User: ライブレンダリング開始
```

### 2. 宿題サポート ("Study Buddy" Pipeline)

**Gemini Vision** で問題を読み取り、**ElevenLabs** でキャラクターの声で解説します。

```mermaid
sequenceDiagram
    participant User as 👤 ユーザー
    participant Gemini as ✨ Gemini (Vision)
    participant Eleven as 🗣️ ElevenLabs

    User->>User: 宿題を撮影
    User->>Gemini: 画像 + "これ教えて"
    Gemini-->>User: 解説テキスト生成
    
    User->>Eleven: テキスト読み上げリクエスト
    Eleven-->>User: 音声データ
    User->>User: キャラクターが喋る
```

---

## ✨ 機能 (Features)

### 🎬 ビデオ・スプラッシュスクリーン
- アプリ起動時にプロフェッショナルなローディング動画を再生
- スムーズなフェードアウト移行

### 🎨 キャラクター作成
- 描いた絵をアップロードして、自分だけのAIキャラクターを作成
- キャラクターに名前を付ける
- キャラクターが声で自己紹介
- バウンス、呼吸、発話エフェクト付きのアニメーションキャラクター

### 📚 宿題分析
- 宿題の画像をアップロード
- AIが子供向けの日本語で宿題を分析・解説
- トピックと難易度を特定
- キャラクターによる音声解説

### 🎤 音声会話
- 声を使って宿題について質問
- Google Geminiによる音声認識（Speech-to-text）
- 宿題の文脈に沿ったAI回答
- ElevenLabsによるテキスト読み上げ（Text-to-speech）
- 吹き出し付きの会話履歴

### 🧠 記憶 & 学習 (MemU)
- エージェントメモリフレームワーク「MemU」との統合
- キャラクター作成、宿題セッション、会話の保存
- 学習の進捗とカバーしたトピックの追跡
- 文脈を考慮した応答のための関連メモリの検索

### 🎨 子供向けデザイン
- 明るく遊び心のあるカラーパレット（スカイブルー、サニーイエロー、コーラルピンク、ハッピーグリーン）
- 影付きの大きな3Dボタン
- 装飾要素（星、キラキラ）
- 明確な視覚的階層
- スムーズなアニメーション

## 🚀 クイックスタート (Quick Start)

```bash
# Install dependencies
npm install

# Start the app
npm start

# Press 'i' for iOS simulator
```

## 🛠️ 技術スタック (Technologies)

### AI & ML
- **Google Gemini 2.5 Flash** - 視覚分析と会話
- **ElevenLabs** - 日本語テキスト読み上げ
- **MemU** - エージェントメモリフレームワーク
- **SAM (Segment Anything)** - 描画のセグメンテーション

### Frontend
- **React Native** - クロスプラットフォームモバイルフレームワーク (Expo)
- **TypeScript** - 型安全なコード
- **Reanimated / Skia** - 高性能アニメーション

### Services
- 音声認識・合成による音声会話
- ビジョンAIによる画像分析
- メモリの保存と検索
- キャラクターアニメーションシステム

## 📂 プロジェクト構造 (Project Structure)

```
amibuddy/
├── src/
│   ├── screens/          # 画面コンポーネント (HomeworkUpload, CharacterCreation etc.)
│   ├── components/       # 再利用可能なコンポーネント
│   ├── services/         # APIサービス (Gemini, ElevenLabs, MemU)
│   ├── navigation/       # ナビゲーション設定
│   └── theme/            # デザインテーマ
├── animation_orchestrator/ # Pythonバックエンド (SAM 2, Rigging)
├── public/               # 静的アセット
└── app.config.js         # Expo設定
```

## 🔧 設定 (Configuration)

`.env` ファイルを作成し、APIキーを設定してください：

```env
# ElevenLabs
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here

# Google Gemini
GEMINI_API_KEY=your_key_here

# MemU
MEMU_API_KEY=your_key_here
MEMU_USER_ID=your_user_id_here
MEMU_AGENT_ID=amibuddy_homework_assistant

# SAM (Backend URL)
SAM_API_URL=https://your-cloud-run-url.run.app
SAM_API_KEY=your_key_here
```

## 📝 ライセンス

Private project

---

Made with ❤️ for children's education

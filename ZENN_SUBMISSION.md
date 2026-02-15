# Zenn Hackathon Submission: AmiBuddy (アミバディ)

## エレベーターピッチ (Elevator Pitch)

「ママ、私の絵がしゃべった！」

小1の娘が「宿題やりたくない」と言うのを見て、エンジニアママが立ち上がりました。**AmiBuddy**は、子供の落書きを**Google Gemini**と**Meta SAM 2**の力で「生きたAI家庭教師」に変えるアプリです。

ただ絵が動くだけではありません。Geminiの視覚機能で宿題（プリント）を読み取り、ElevenLabsで生成された「自分の絵の声」で、優しくヒントを教えてくれます。「勉強しなさい」と言う代わりに、「バディと一緒に冒険しよう」と言える世界へ。

最新AI技術を駆使して、親子の学習時間を孤独な戦いからワクワクするエンターテインメントに変えます。

---
# AmiBuddy: Living AI Agent Pipeline

## Overview
This project transforms static children's drawings into "Living AI Agents" using a Multi-Agentic pipeline. It leverages Google's Gemini 3 Pro, Nano Banana (simulated high-fidelity upscaling), and Veo 3.1 to create cinematic animations.

## Architecture

### Phase 1: Visual Decomposition (Gemini 3 Pro Agent)
**Agentic Reasoning**: We use Gemini 3 Pro's vision capabilities to "understand" the drawing, not just see it.
- **Input**: Raw child's drawing.
- **Process**: The `VisualDecompositionAgent` analyzes the image to extract a "Skeletal Map" and semantic description.
- **Output**: `character_rig.json` containing keypoints (nose, eyes, limbs) and a rich visual description.

### Phase 2: High-Fidelity Asset Prep (Nano Banana Agent)
**Asset Enhancement**: 
- **Input**: Raw drawing.
- **Process**: The `AssetPrepAgent` utilizes `rembg` for precise background removal and upscaling algorithms to prepare the asset for 4K video generation.
- **Output**: Clean, high-resolution alpha-transparent PNG.

### Phase 3: Cinematic Animation (Veo 3.1 Agent)
**Generative Physics**:
- **Input**: Character description (from Phase 1) and Processed Asset (from Phase 2).
- **Process**: The `AnimationAgent` constructs a prompt using the "First and Last Frame" technique for Veo 3.1.
  - **Prompt Formula**: `[Shot] + [Subject] + [Action] + [Aesthetics]`
  - **Aesthetics**: "Soft crayon texture, vibrant colors, warm Hanamaru glow" ensures the "Kawaii" look is preserved.
- **Audio Sync**: ElevenLabs integration ensures the mouth movements sync with the generated audio.

### Phase 4: Deployment
The entire pipeline is orchestrated by a Python-based microservice deployed on Google Cloud Run, capable of scaling to handle multiple requests from the AmiBuddy app.

## Tech Stack
- **Gemini 1.5 Pro (Simulating 3 Pro)**: Vision understanding.
- **Vertex AI (Veo 3.1)**: Video generation.
- **ElevenLabs**: Text-to-Speech & Sync.
- **Python/FastAPI**: Orchestration.
- **Docker/Cloud Run**: Deployment.

## "Agentic Reasoning" meets "Generative Physics"

---

## 動作確認に関する特記事項 (Special Notes on Operation Verification)

### 1. アプリケーションURL
Webブラウザから以下のURLにアクセスしてください（PC推奨ですが、スマホでも動作します）。
**[URLをここに記入してください]**

### 2. テスト用アカウント
動作確認用の特別なアカウントは設けておりませんが、サインアップは開放しております。
任意のメールアドレスとパスワードで新規登録を行っていただくか、以下のテスト用クレデンシャルをご利用ください（もし用意があれば）。

*   **Email:** guest@example.com (例)
*   **Password:** password123 (例)

### 3. 推奨環境・権限
*   **ブラウザ:** Google Chrome (最新版) 推奨。
*   **デバイス:** カメラ付きのPC、またはスマートフォン。
*   **権限:** アプリ内で「カメラ」および「マイク」の使用許可が求められます。宿題の撮影やボイスチャット機能に必須ですので、許可をお願いいたします。

### 4. 注意点
*   Gemini APIやElevenLabsの無料枠/レート制限により、応答に時間がかかる場合や、一時的にエラーになる場合があります。その際は少し時間を置いて再度お試しください。

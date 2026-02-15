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
The core innovation is using Gemini's reasoning (understanding *what* the character is and *where* its parts are) to guide Veo's generative physics (knowing *how* it should move). This prevents the common "morphing" artifacts seen in pure image-to-video generation by grounding the generation in substantial structural understanding.

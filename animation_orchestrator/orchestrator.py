import os
import argparse
import sys
from agents.visual_decomposition import VisualDecompositionAgent
from agents.asset_prep import AssetPrepAgent
from agents.animation import AnimationAgent

def main():
    parser = argparse.ArgumentParser(description="AmiBuddy Animation Orchestrator")
    parser.add_argument("image_path", help="Path to the input drawing")
    parser.add_argument("--output", help="Path to the output video", default="output.mp4")
    parser.add_argument("--api-key", help="Gemini API Key", default="AIzaSyBiEYaR5IzEgHKXoq8vbcLDMxYOXm18qjg")
    args = parser.parse_args()

    if not args.api_key:
        print("Error: Gemini API Key is required. Set GEMINI_API_KEY env var or pass --api-key.")
        sys.exit(1)

    try:
        # Phase 1: Visual Decomposition
        print("--- Phase 1: Visual Decomposition (Gemini 3 Pro Agent) ---")
        decomposition_agent = VisualDecompositionAgent(api_key=args.api_key)
        rig = decomposition_agent.analyze_image(args.image_path)
        print(f"Character Identified: {rig.character_name}")
        print(f"Description: {rig.description}")
        print(f"Keypoints detected: {len(rig.keypoints)}")

        # Phase 2: Asset Prep
        print("\n--- Phase 2: High-Fidelity Asset Prep (Nano Banana Agent) ---")
        asset_agent = AssetPrepAgent()
        processed_image_path = "temp_processed_asset.png"
        asset_agent.process_image(args.image_path, processed_image_path)
        print(f"Asset processed and saved to {processed_image_path}")

        # Phase 3: Animation
        print("\n--- Phase 3: Cinematic Animation (Veo 3.1 Agent) ---")
        animation_agent = AnimationAgent()
        
        # In a real scenario, we would generate audio here using ElevenLabs
        # audio_content = elevenlabs_agent.generate_voice("Hello! I am alive!")
        audio_path = None 
        
        video_path = animation_agent.generate_animation(
            processed_image_path, 
            audio_path=audio_path,
            character_description=rig.description
        )
        
        # Move/Rename output if needed
        if video_path != args.output:
            os.replace(video_path, args.output)

        print(f"\n✅ Animation complete! Saved to {args.output}")

    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}")
        sys.exit(1)
    finally:
        # Cleanup
        if os.path.exists("temp_processed_asset.png"):
            os.remove("temp_processed_asset.png")

if __name__ == "__main__":
    main()

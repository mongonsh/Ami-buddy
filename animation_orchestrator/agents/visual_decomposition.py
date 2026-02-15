from google import genai
import PIL.Image
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os

class Keypoint(BaseModel):
    name: str = Field(..., description="Name of the keypoint (e.g., nose, left_eye, right_shoulder)")
    x: float = Field(..., description="Normalized X coordinate (0.0-1.0)")
    y: float = Field(..., description="Normalized Y coordinate (0.0-1.0)")
    confidence: float = Field(..., description="Confidence score (0.0-1.0)")

class CharacterRig(BaseModel):
    character_name: str = Field(default="Unknown", description="Name of the character")
    description: str = Field(default="", description="Visual description of the character")
    keypoints: List[Keypoint] = Field(..., description="List of detected keypoints")

class VisualDecompositionAgent:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required")
        self.client = genai.Client(api_key=self.api_key)

    def analyze_image(self, image_path: str) -> CharacterRig:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")

        img = PIL.Image.open(image_path)

        prompt = """
        Analyze this drawing of a character for animation rigging.
        I need you to extract a 'skeletal map' by identifying key body parts.
        
        Please identify the following keypoints if visible:
        - nose
        - left_eye, right_eye
        - left_ear, right_ear
        - left_shoulder, right_shoulder
        - left_elbow, right_elbow
        - left_wrist, right_wrist
        - left_hip, right_hip
        - left_knee, right_knee
        - left_ankle, right_ankle
        
        Output the result as a JSON object matching this structure:
        {
            "character_name": "Name if written, else a creative name",
            "description": "Brief visual description",
            "keypoints": [
                {"name": "nose", "x": 0.5, "y": 0.3, "confidence": 0.95},
                ...
            ]
        }
        
        Ensure coordinates are normalized (0.0 to 1.0) relative to the image width and height.
        """

        # Using the new SDK client method
        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, img],
            config={"response_mime_type": "application/json"}
        )
        
        try:
            # Clean up potential markdown code blocks
            text = response.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(text)
            return CharacterRig(**data)
        except json.JSONDecodeError:
            print(f"Failed to parse JSON response: {response.text}")
            raise
        except Exception as e:
            print(f"Error creating CharacterRig: {e}")
            raise

if __name__ == "__main__":
    # Example usage
    agent = VisualDecompositionAgent()
    # rig = agent.analyze_image("path/to/drawing.jpg")
    # print(rig.model_dump_json(indent=2))

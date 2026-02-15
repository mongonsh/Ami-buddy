import logging
import json
import os
from typing import Dict, Any, Optional

from google import genai
from google.genai import types
import PIL.Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RiggingAgent:
    def __init__(self, location: str = "us-central1", project_id: str = "amibuddy"):
        # Prioritize API Key for simplicity and model access (Gemini 2.5 Flash via AI Studio)
        self.api_key = os.environ.get("GEMINI_API_KEY")
        
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Successfully initialized Gen AI Client with API Key.")
            except Exception as e:
                logger.error(f"Failed to init Gen AI Client: {e}")
                self.client = None
        else:
            logger.error("GEMINI_API_KEY not found. Vertex AI fallback is disabled to prevent costs.")
            raise ValueError("GEMINI_API_KEY is required. Please set it in your environment.")

    def analyze_image(self, image_path: str) -> Optional[Dict[str, Any]]:
        """
        Analyzes the character image to identify joints and body parts.
        Returns a JSON object with 'joints' (x,y) and 'parts' (bounding_box).
        """
        if not self.client:
            raise ValueError("Google Gen AI Client is not initialized. Check GEMINI_API_KEY.")

        # prompt
        prompt = """
        Analyze this character drawing for skeletal animation.
        Provide a JSON object with the following structure:
        {
            "joints": {
                "neck": [x, y],
                "left_shoulder": [x, y],
                "right_shoulder": [x, y],
                "left_elbow": [x, y],
                "right_elbow": [x, y],
                "left_hand": [x, y],
                "right_hand": [x, y],
                "hips": [x, y]
            },
            "parts": {
                "head": [ymin, xmin, ymax, xmax],
                "body": [ymin, xmin, ymax, xmax],
                "left_arm": [ymin, xmin, ymax, xmax],
                "right_arm": [ymin, xmin, ymax, xmax],
                "left_leg": [ymin, xmin, ymax, xmax],
                "right_leg": [ymin, xmin, ymax, xmax]
            },
             "mouth": {
                "center": [x, y],
                "box": [ymin, xmin, ymax, xmax]
             }
        }
        Coordinates should be normalized (0.0 to 1.0).
        IMPORTANT: For "parts", ensure the bounding boxes are GENEROUS and INCLUSIVE. 
        Include the ENTIRE limb, even if it overlaps with the body slightly. 
        Do not crop off hands, feet, or joints. It is better to include a bit more than less.
        For example, "left_arm" should include the shoulder, elbow, wrist, and hand.
        RETURN ONLY JSON.
        """

        try:
             # Use PIL to load image for SDK
             img = PIL.Image.open(image_path)

             # Try different models if one fails or use a standard one
             # User requested gemini-2.5-flash
             model_id = "gemini-2.5-flash" 
             
             logger.info(f"Sending request to Gemini ({model_id})...")
             
             response = self.client.models.generate_content(
                model=model_id,
                contents=[prompt, img],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
             
             if response.text:
                logger.info("Gemini response received.")
                # Clean up potential markdown code blocks
                clean_text = response.text.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_text)
             else:
                 error_msg = f"No JSON returned from Gemini. Response: {response}"
                 logger.error(error_msg)
                 raise ValueError(error_msg)

        except Exception as e:
            logger.error(f"Rigging analysis failed: {e}", exc_info=True)
            raise # Propagate error to main.py to show usage details

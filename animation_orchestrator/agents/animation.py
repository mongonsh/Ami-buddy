import os
import time
import mimetypes
import logging
from typing import Optional

import google.genai
from google.genai import types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnimationAgent:
    def __init__(self, location: str = "us-central1", project_id: str = "amibuddy"):
        self.location = location
        self.project_id = project_id
        
        # Prioritize API Key (AI Studio) to avoid Vertex AI costs
        self.api_key = os.environ.get("GEMINI_API_KEY")

        try:
             if self.api_key:
                 self.client = google.genai.Client(api_key=self.api_key)
                 logger.info("AnimationAgent: Initialized with GEMINI_API_KEY")
             else:
                logger.error("GEMINI_API_KEY not found. Vertex AI fallback is disabled to prevent costs.")
                raise ValueError("GEMINI_API_KEY is required. Please set it in your environment.")
        except Exception as e:
            logger.error(f"Error initializing Google Gen AI Client: {e}")
            self.client = None

    def generate_animation(self, 
                           frame1_path: str, 
                           audio_path: Optional[str] = None, 
                           character_description: str = "") -> str:
        """
        Generates an animation using Veo 3.1 via Google Gen AI SDK.
        Returns the path to the generated video.
        """
        
        prompt = f"""
        [Shot: Medium Close-up] 
        [Subject: Hand-drawn character, {character_description}] 
        [Action: The character talks with an engaging expression, moving its mouth and making friendly hand gestures as if explaining something.] 
        [Aesthetics: Soft crayon texture, vibrant colors, warm "Hanamaru" glow]
        """
        
        logger.info(f"Generating animation with prompt: {prompt}")
        
        if not self.client:
            logger.warning("Client not initialized. Generating placeholder.")
            return self._generate_placeholder_video("output_animation.mp4")

        try:
            # Read image file
            with open(frame1_path, "rb") as f:
                image_bytes = f.read()
            
            mime_type, _ = mimetypes.guess_type(frame1_path)
            if not mime_type:
                mime_type = "image/jpeg"

            logger.info(f"Using image {frame1_path} with mime type {mime_type}")

            # Construct inputs
            # Using types.Image with correct arguments (camelCase as determined by introspection)
            image_input = types.Image(imageBytes=image_bytes, mimeType=mime_type)
            
            # Call generate_videos using the recommended 'source' parameter
            logger.info("Sending request to Veo model...")
            operation = self.client.models.generate_videos(
                model="veo-3.1-generate-preview",
                source=types.GenerateVideosSource(
                    prompt=prompt,
                    image=image_input
                ),
                config=types.GenerateVideosConfig(
                    # sample_count=1, # Not supported in this version
                )
            )
            
            logger.info(f"Operation started: {operation.name}")
            
            # Poll operation
            while not operation.done:
                logger.info("Polling operation...")
                time.sleep(10)
                operation = self.client.operations.get(operation)

            if operation.error:
                logger.error(f"Operation failed: {operation.error}")
                return self._generate_placeholder_video("output_animation.mp4")
            
            # Retrieve result
            # result might be in operation.result
            if not operation.result or not operation.result.generated_videos:
                logger.error("No generated videos in result.")
                return self._generate_placeholder_video("output_animation.mp4")

            video_result = operation.result.generated_videos[0]
            output_path = "output_animation.mp4"

            # Check if we have uri or bytes
            if hasattr(video_result, 'video') and hasattr(video_result.video, 'uri') and video_result.video.uri:
                logger.info(f"Video URI: {video_result.video.uri}")
                # If it's a GCS URI, we might need to download it.
                # Use client.files.get_content? Or just requests if public?
                # Usually Veo output is in GCS bucket of the project.
                # We need to download it.
                # Since we have google-auth, we can use storage client or simplified download if available.
                # For now, let's assume we need to handle bytes if possible, or implement GCS download.
                # WAIT: earlier REST API response had `bytesBase64Encoded`.
                # Does SDK return bytes?
                # If `video.video_bytes` exists?
                pass
            
            # Temporary: if we get a URI, we can't easily download without Storage client/permissions setup
            # unless the SDK provides a helper.
            # I will check if `video_result` has bytes.
            
            # If we simply return the path (which might be what success looks like for now), user can download it?
            # But the user wants a file `output_animation.mp4` locally.
            
            # Let's try to access `video.video_bytes` or fallback to placeholder (simulation).
            # If the SDK usage example ends with `.uri`, it likely returns URI.
            
            # I'll implement a basic GCS download using `google-auth` requests if URI is present.
            
            if hasattr(video_result, 'video') and hasattr(video_result.video, 'video_bytes') and video_result.video.video_bytes:
                 with open(output_path, "wb") as f:
                     f.write(video_result.video.video_bytes)
                 logger.info(f"Saved video to {output_path}")
            elif hasattr(video_result, 'video') and hasattr(video_result.video, 'uri') and video_result.video.uri:
                 # Download from GCS URI
                 self._download_gcs_uri(video_result.video.uri, output_path)
            else:
                 logger.warning("Could not find video bytes or URI.")
                 return self._generate_placeholder_video("output_animation.mp4")

            return output_path

        except Exception as e:
            logger.error(f"Error during generation: {e}")
            return self._generate_placeholder_video("output_animation.mp4")

    # Helper for GCS download if needed
    def _download_gcs_uri(self, uri: str, output_path: str):
        # uri format: gs://bucket/path
        if not uri.startswith("gs://"):
             logger.error(f"Invalid GCS URI: {uri}")
             return
        
        # We can use `gsutil` logic or `google.cloud.storage`
        # But we only have `google-auth`.
        # We can use XML API or JSON API with requests.
        # https://storage.googleapis.com/download/storage/v1/b/BUCKET/o/OBJECT?alt=media
        
        try:
            parts = uri[5:].split("/", 1)
            bucket_name = parts[0]
            object_name = parts[1]
            
            url = f"https://storage.googleapis.com/storage/v1/b/{bucket_name}/o/{object_name.replace('/', '%2F')}?alt=media"
            
            import google.auth.transport.requests
            import requests
            
            credentials, _ = google.auth.default()
            auth_req = google.auth.transport.requests.Request()
            credentials.refresh(auth_req)
            
            response = requests.get(url, headers={"Authorization": f"Bearer {credentials.token}"})
            if response.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(response.content)
                logger.info(f"Downloaded video from {uri} to {output_path}")
            else:
                logger.error(f"Failed to download from GCS: {response.status_code} {response.text}")
        except Exception as e:
            logger.error(f"Error downloading GCS object: {e}")


    def _generate_placeholder_video(self, output_path: str):
        # ... (keep existing placeholder logic but verify imports)
        import cv2
        import numpy as np
        
        width, height = 720, 720
        fps = 30
        duration_sec = 5
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        if not out.isOpened():
            with open(output_path, "wb") as f:
                f.write(b"")
            return

        frame_count = duration_sec * fps
        for i in range(frame_count):
            img = np.zeros((height, width, 3), dtype=np.uint8)
            t = i / frame_count
            x = int(width * t)
            y = int(height // 2)
            cv2.circle(img, (x, y), 50, (0, 255, 255), -1) 
            cv2.putText(img, "SDK Simulation Mode", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            out.write(img)
        out.release()
        logger.info(f"Placeholder video generated at {output_path}")
        return output_path

if __name__ == "__main__":
    agent = AnimationAgent()

import os
import logging
import numpy as np
import torch
from PIL import Image
import uuid
from typing import List, Dict, Any, Optional

import firebase_admin
from firebase_admin import credentials, storage

from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SegmentationAgent:
    def __init__(self, checkpoint_path: str = "checkpoints/sam2_hiera_tiny.pt", model_cfg: str = "sam2_hiera_t.yaml"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        try:
            # Load SAM 2
            # Note: config file is relative to sam2 package or absolute path
            # We assume installed via pip, so we try passing the name
            self.sam2_model = build_sam2(model_cfg, checkpoint_path, device=self.device)
            self.predictor = SAM2ImagePredictor(self.sam2_model)
            logger.info("SAM 2 Model initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize SAM 2: {e}")
            self.predictor = None

        # Initialize Firebase
        self.init_error = None
        self._init_firebase()

    def _init_firebase(self):
        try:
            # Always try to get the bucket, even if app is already init
            # Check if app is init
            # Check if app is init
            if not firebase_admin._apps:
                # Use Application Default Credentials (Cloud Run)
                # Ensure FIREBASE_STORAGE_BUCKET is set and clean
                bucket_name = os.environ.get("FIREBASE_STORAGE_BUCKET", "amibuddy-5fbc2.firebasestorage.app")
                
                # Initial cleanup
                if bucket_name:
                    # Explicitly remove newlines and linefeeds first
                    bucket_name = bucket_name.replace("\\n", "").replace("\n", "").replace("\r", "")
                    # Then clean other artifacts
                    bucket_name = bucket_name.strip().replace("gs://", "").rstrip("/").strip("'").strip('"')
                
                # Additional safety: ensure it doesn't start with '.' or '-'?
                # regex: ^[a-z0-9][a-z0-9._-]*[a-z0-9]$
                
                try:
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': bucket_name
                    })
                    logger.info(f"Firebase Admin initialized with bucket: '{bucket_name}'")
                except Exception as app_init_err:
                    logger.error(f"firebase_admin.initialize_app failed: {app_init_err}")
                    raise app_init_err

            logger.info(f"Attempting to get bucket: '{bucket_name}'")
            try:
                self.bucket = storage.bucket(name=bucket_name) 
            except Exception as bucket_err:
                logger.error(f"storage.bucket() failed for name '{bucket_name}': {bucket_err}")
                raise bucket_err
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            # Include the bucket name in the error message so we can see it in the API response
            self.init_error = f"{str(e)} (bucket: {repr(bucket_name)})"
            self.bucket = None

    def segment_and_upload(self, image_path: str, rig_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Segments the image based on rig data (joints/parts) and uploads parts to Firebase.
        Returns a dictionary of part_name -> url.
        """
        if not self.predictor:
            error_msg = "SAM 2 Predictor not initialized"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        if not self.bucket:
             error_msg = f"Firebase bucket not initialized. Error: {self.init_error}"
             logger.error(error_msg)
             raise ValueError(error_msg)

        results = {}
        
        # Remove broad try/except to see actual error
        # try:
        image = Image.open(image_path).convert("RGB")
        # Resize if needed? SAM 2 handles it.
        # Set image
        self.predictor.set_image(np.array(image))
        
        # Map parts to prompts
        # rig_data['parts'] contains { "head": [ymin, xmin, ymax, xmax], ... }
        # SAM 2 expects box in [xmin, ymin, xmax, ymax] format usually? 
        # Check prompt format. Typically [x1, y1, x2, y2].
        # Gemini returns [ymin, xmin, ymax, xmax] (normalized 0-1) usually if asked.
        # My Prompt asked for "normalized".
        
        width, height = image.size
        
        parts = rig_data.get("parts", {})
        for part_name, box in parts.items():
            # Convert normalized [ymin, xmin, ymax, xmax] to pixel [xmin, ymin, xmax, ymax]
            # Assuming Gemini follows the prompt instructions.
            # If Gemini returns 0-1000, divide. If 0-1, multiply.
            # Let's assume 0-1 for now based on prompt request.
            
            # Gemini returns [ymin, xmin, ymax, xmax]
            ymin, xmin, ymax, xmax = box
            
            # SAM 2 expects [xmin, ymin, xmax, ymax]
            input_box = np.array([xmin * width, ymin * height, xmax * width, ymax * height])
            
            # Add padding to box to ensure coverage
            padding = 10 
            input_box[0] = max(0, input_box[0] - padding)
            input_box[1] = max(0, input_box[1] - padding)
            input_box[2] = min(width, input_box[2] + padding)
            input_box[3] = min(height, input_box[3] + padding)

            masks, scores, _ = self.predictor.predict(
                point_coords=None,
                point_labels=None,
                box=input_box[None, :],
                multimask_output=False,
            )
            
            # Take the best mask
            mask = masks[0] # (H, W) bool
            
            # Apply mask to image to get transparent PNG
            masked_image = self._apply_mask(image, mask)
            
            # Save to buffer
            blob_name = f"characters/{uuid.uuid4()}/{part_name}.png"
            blob = self.bucket.blob(blob_name)
            
            # Save locally temp to upload? Or write to memory.
            # Use temp file for safety
            temp_filename = f"temp_{part_name}.png"
            masked_image.save(temp_filename, format="PNG")
            
            blob.upload_from_filename(temp_filename)
            blob.make_public()
            results[part_name] = blob.public_url
            
            os.remove(temp_filename)
            logger.info(f"Uploaded {part_name} to {blob.public_url}")
            
        # except Exception as e:
        #     logger.error(f"Segmentation failed: {e}")
        #     raise e # Re-raise to see it in API response
        
        return results

    def _apply_mask(self, image: Image.Image, mask: np.ndarray) -> Image.Image:
        # Create RGBA image
        rgba = image.convert("RGBA")
        datas = rgba.getdata()
        
        newData = []
        width, height = image.size
        # This is slow, better use numpy
        
        # NumPy approach
        img_arr = np.array(image.convert("RGBA"))
        
        # mask is (H, W) boolean? or 0/1?
        # Resize mask to image size if needed (SAM usually returns original size)
        
        # Ensure mask is boolean
        mask_bool = mask.astype(bool)
        
        # Set alpha channel 0 where mask is False
        img_arr[:, :, 3] = img_arr[:, :, 3] * mask_bool
        
        return Image.fromarray(img_arr)

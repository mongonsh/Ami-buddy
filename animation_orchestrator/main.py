import os
import shutil
import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from agents.visual_decomposition import VisualDecompositionAgent
from agents.asset_prep import AssetPrepAgent
from agents.animation import AnimationAgent
from agents.rigging import RiggingAgent
from agents.segmentation import SegmentationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AmiBuddy Animation Orchestrator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for lazy loading
decomposition_agent = None
asset_agent = None
animation_agent = None
rigging_agent = None
segmentation_agent = None

def get_agents():
    global decomposition_agent, asset_agent, animation_agent, rigging_agent, segmentation_agent
    
    if decomposition_agent is None:
        try:
            logger.info("Initializing VisualDecompositionAgent...")
            decomposition_agent = VisualDecompositionAgent()
        except Exception as e:
            logger.error(f"Failed to init VisualDecompositionAgent: {e}")
            
    if asset_agent is None:
        try:
            logger.info("Initializing AssetPrepAgent...")
            asset_agent = AssetPrepAgent()
        except Exception as e:
             logger.error(f"Failed to init AssetPrepAgent: {e}")

    if animation_agent is None:
        try:
            logger.info("Initializing AnimationAgent...")
            animation_agent = AnimationAgent()
        except Exception as e:
            logger.error(f"Failed to init AnimationAgent: {e}")
            
    if rigging_agent is None:
        try:
            logger.info("Initializing RiggingAgent...")
            rigging_agent = RiggingAgent()
        except Exception as e:
            logger.error(f"Failed to init RiggingAgent: {e}")

    if segmentation_agent is None:
        try:
            logger.info("Initializing SegmentationAgent...")
            segmentation_agent = SegmentationAgent()
        except Exception as e:
            logger.error(f"Failed to init SegmentationAgent: {e}")
            
    return decomposition_agent, asset_agent, animation_agent, rigging_agent, segmentation_agent
    
class AnimationResponse(BaseModel):
    video_url: str
    character_name: str
    description: str

class SegmentationResponse(BaseModel):
    rig_data: dict
    part_urls: dict

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/segment-character", response_model=SegmentationResponse)
async def segment_character(
    file: UploadFile = File(...)
):
    """
    Analyzes the character, creates a rig, segments parts, and returns all data for the frontend.
    """
    temp_input_path = f"temp_seg_{file.filename}"
    
    try:
        # Save uploaded file
        with open(temp_input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"Received image for segmentation: {file.filename}")

        # Lazy load agents
        _, _, _, rig_agent, seg_agent = get_agents()
        
        if not rig_agent or not seg_agent:
             raise HTTPException(status_code=500, detail="Agents are not initialized.")

        # Step 1: Rigging (Gemini)
        logger.info("Starting Rigging Analysis...")
        rig_data = rig_agent.analyze_image(temp_input_path)
        if not rig_data:
            raise HTTPException(status_code=500, detail="Rigging analysis failed.")
            
        logger.info(f"Rig Data: {rig_data}")

        # Step 2: Segmentation (SAM 2)
        logger.info("Starting Segmentation...")
        part_urls = seg_agent.segment_and_upload(temp_input_path, rig_data)
        
        if not part_urls:
            logger.warning("Segmentation returned empty, but returning rig data.")
            # raise HTTPException(status_code=500, detail="Segmentation failed.")

        return SegmentationResponse(
            rig_data=rig_data,
            part_urls=part_urls
        )

    except Exception as e:
        logger.error(f"Segmentation endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_input_path):
            os.remove(temp_input_path)

@app.post("/animate")
async def generate_animation(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    character_description: Optional[str] = None
):
    """
    Legacy video generation endpoint.
    """
    temp_input_path = f"temp_{file.filename}"
    processed_asset_path = f"processed_{file.filename}.png"
    output_video_path = f"output_{file.filename}.mp4"
    
    try:
        # Save uploaded file
        with open(temp_input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"Received image: {file.filename}")

        # Lazy load agents
        dec_agent, ast_agent, anim_agent, _, _ = get_agents()
        
        if not dec_agent or not ast_agent or not anim_agent:
             raise HTTPException(status_code=500, detail="Agents are not initialized.")

        # Phase 1: Visual Decomposition
        # If character_description is not provided, we derive it
        rig_desc = character_description
        rig_name = "Unknown"
        
        try:
            logger.info("Starting Visual Decomposition...")
            rig = dec_agent.analyze_image(temp_input_path)
            rig_desc = rig.description
            rig_name = rig.character_name
            logger.info(f"Character Analyzed: {rig_name}")
        except Exception as e:
            logger.error(f"Visual Decomposition failed: {e}")
            # Fallback if decomposition fails (optional, or re-raise)
            if not rig_desc:
                rig_desc = "A character drawing"

        # Phase 2: Asset Prep
        logger.info("Starting Asset Prep...")
        ast_agent.process_image(temp_input_path, processed_asset_path)

        # Phase 3: Animation
        logger.info("Starting Animation Generation...")
        # Audio is optional/None for now as per orchestrator.py
        video_path = anim_agent.generate_animation(
            processed_asset_path, 
            audio_path=None, 
            character_description=rig_desc
        )

        if not os.path.exists(video_path):
            raise HTTPException(status_code=500, detail="Video generation failed to produce output.")

        # Rename to specific output path if different
        if video_path != output_video_path:
            shutil.move(video_path, output_video_path)

        # Clean up input files immediately
        cleanup_files(temp_input_path, processed_asset_path)
        
        # Schedule cleanup of output video after sending response? 
        # FileResponse doesn't easily support cleanup after stream.
        # For a simple prototype, we keep it or rely on Cloud Run container restart/cleanup.
        # Or we can use a background task to delete it after a delay? 
        # Actually, FileResponse holds the file open.
        # We will leave the output file for now or implement a periodic cleanup if this were long-running.
        
        return FileResponse(output_video_path, media_type="video/mp4", filename="animation.mp4")

    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        # Cleanup on failure
        cleanup_files(temp_input_path, processed_asset_path)
        if os.path.exists(output_video_path):
            os.remove(output_video_path)
            
        raise HTTPException(status_code=500, detail=str(e))



def cleanup_files(*paths):
    for path in paths:
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file {path}: {e}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

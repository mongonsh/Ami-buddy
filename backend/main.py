from fastapi import FastAPI, UploadFile, File, Response
from PIL import Image
import io
import numpy as np
import torch
from transformers import AutoProcessor, AutoModelForMaskGeneration

app = FastAPI()

processor = AutoProcessor.from_pretrained("facebook/sam-vit-base")
model = AutoModelForMaskGeneration.from_pretrained("facebook/sam-vit-base")
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

@app.post("/segment")
async def segment(file: UploadFile = File(...)):
    data = await file.read()
    img = Image.open(io.BytesIO(data)).convert("RGB")
    w, h = img.size
    cx, cy = w / 2.0, h / 2.0
    pts = [
        [cx, cy],
        [w * 0.4, h * 0.4],
        [w * 0.6, h * 0.4],
        [w * 0.4, h * 0.6],
        [w * 0.6, h * 0.6],
    ]
    labels = [1] * len(pts)
    inputs = processor(images=img, input_points=[pts], input_labels=[labels], return_tensors="pt")
    inputs = {k: (v.to(device) if hasattr(v, "to") else v) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs)
    masks = processor.post_process_masks(outputs.pred_masks, inputs["original_sizes"], inputs["geometries"])[0]
    mask = masks.sum(axis=0)
    mask = (mask > 0.5).astype(np.uint8) * 255
    alpha = Image.fromarray(mask, mode="L").resize(img.size, Image.NEAREST)
    rgba = Image.new("RGBA", img.size)
    rgba.paste(img, (0, 0))
    rgba.putalpha(alpha)
    buf = io.BytesIO()
    rgba.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")

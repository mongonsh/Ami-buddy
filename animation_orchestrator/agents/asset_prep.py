from rembg import remove
from PIL import Image
import io
import os

class AssetPrepAgent:
    def __init__(self):
        pass

    def process_image(self, input_path: str, output_path: str, upscale_factor: int = 2):
        """
        Removes background and optionally upscales the image.
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input image not found: {input_path}")

        # Load image
        with open(input_path, 'rb') as i:
            input_data = i.read()
            subject = remove(input_data)
        
        img = Image.open(io.BytesIO(subject))
        
        # Upscale (Basic implementation using PIL, real "Nano Banana" might use better AI upscaling)
        # Using LANCZOS for high quality downsampling/upsampling
        new_size = (img.width * upscale_factor, img.height * upscale_factor)
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Ensure directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        # Save as PNG
        img.save(output_path, format="PNG")
        print(f"Processed image saved to {output_path}")

if __name__ == "__main__":
    agent = AssetPrepAgent()
    # agent.process_image("path/to/raw.jpg", "path/to/processed.png")

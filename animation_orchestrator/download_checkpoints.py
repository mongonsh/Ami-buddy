import os
import requests

CHECKPOINT_URL = "https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_tiny.pt"
CONFIG_URL = "https://raw.githubusercontent.com/facebookresearch/sam2/main/sam2/configs/sam2_hiera_tiny.yaml"

def download_file(url, filename):
    if os.path.exists(filename):
        print(f"{filename} already exists.")
        return
    
    print(f"Downloading {filename} from {url}...")
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Downloaded {filename}")
    else:
        print(f"Failed to download {filename}: {response.status_code}")

if __name__ == "__main__":
    os.makedirs("checkpoints", exist_ok=True)
    # Download tiny checkpoint
    download_file(CHECKPOINT_URL, "checkpoints/sam2_hiera_tiny.pt")
    # We might not need the yaml if we use the model registry name "sam2_hiera_tiny"

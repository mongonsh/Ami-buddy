import requests
import os

ENDPOINT = "https://animation-orchestrator-535548706733.asia-northeast1.run.app/animate"

def create_red_square(path):
    from PIL import Image
    img = Image.new('RGB', (100, 100), color='red')
    img.save(path)

def test_live_api():
    img_path = "test_input_live.jpg"
    create_red_square(img_path)
    
    try:
        print(f"Sending request to {ENDPOINT}...")
        with open(img_path, "rb") as f:
            response = requests.post(
                ENDPOINT,
                files={"file": ("test_input_live.jpg", f, "image/jpeg")},
                data={"character_description": "A red square character"}
            )
            
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success! Video headers:", response.headers)
            with open("test_output_live.mp4", "wb") as f:
                f.write(response.content)
            print("Saved test_output_live.mp4")
        else:
            print("Error:", response.text)
            
    finally:
        if os.path.exists(img_path):
            os.remove(img_path)

if __name__ == "__main__":
    test_live_api()

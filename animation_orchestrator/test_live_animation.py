import requests
import json
import os
import sys

# Configuration
DEFAULT_API_URL = "http://localhost:8000/segment-character"
TEST_IMAGE_PATH = "test_character.jpg"

def test_segmentation():
    """Tests the character segmentation endpoint."""
    
    api_url = DEFAULT_API_URL
    if len(sys.argv) > 1:
        api_url = sys.argv[1]
        # Append endpoint if user just provided base URL
        if not api_url.endswith("/segment-character"):
             api_url = api_url.rstrip("/") + "/segment-character"
             
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"Error: Test image '{TEST_IMAGE_PATH}' not found. Please place a .jpg file here.")
        return

    print(f"Sending {TEST_IMAGE_PATH} to {api_url}...")

    try:
        with open(TEST_IMAGE_PATH, "rb") as f:
            files = {"file": f}
            response = requests.post(api_url, files=files, timeout=300) # Increased timeout for Cloud Run cold start

        if response.status_code == 200:
            data = response.json()
            print("\n✅ Success! Segmentation complete.")
            
            print("\nRig Data Summary:")
            rig = data.get("rig_data", {})
            print(f"  - Joints found: {len(rig.get('joints', {}))}")
            print(f"  - Parts found: {len(rig.get('parts', {}))}")
            
            print("\nPart URLs:")
            for part, url in data.get("part_urls", {}).items():
                print(f"  - {part}: {url[:50]}...")
                
        else:
            print(f"\n❌ Error: API returned status {response.status_code}")
            print(response.text)

    except requests.exceptions.ConnectionError:
        print(f"\n❌ Error: Could not connect to {api_url}")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")

if __name__ == "__main__":
    test_segmentation()

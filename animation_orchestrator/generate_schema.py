from agents.visual_decomposition import CharacterRig
import json

with open("character_rig_schema.json", "w") as f:
    json.dump(CharacterRig.model_json_schema(), f, indent=2)

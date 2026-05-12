import json
import os

# --- SETTINGS ---
INPUT_FILE = "items.json"  # Replace with your filename
OUTPUT_FILE = "items_fixed.json"
DEFAULT_TYPE = "G"  # "G" stands for Adventuring Gear in 5eTools
# ----------------

def process_json():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Could not find {INPUT_FILE}")
        return

    print(f"Reading {INPUT_FILE}...")

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Malformed JSON: {e}")
            return

    if "item" not in data:
        print("Error: No 'item' array found in this JSON.")
        return

    items = data["item"]
    missing_type_count = 0
    fixed_items = []

    print(f"Scanning {len(items)} items...\n")

    for index, item in enumerate(items):
        name = item.get("name", "Unknown Name")

        # Check if 'type' key is missing or is empty/None
        if "type" not in item or not item["type"]:
            missing_type_count += 1
            print(f"[!] Item #{index} is missing a type: '{name}'")

            # Create a fixed version of the item
            fixed_item = item.copy()
            fixed_item["type"] = DEFAULT_TYPE
            fixed_items.append(fixed_item)
        else:
            fixed_items.append(item)

    print("\n" + "="*30)
    if missing_type_count > 0:
        print(f"Found {missing_type_count} items with missing types.")

        # Save the fixed file
        data["item"] = fixed_items
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        print(f"Fixed JSON saved to: {OUTPUT_FILE}")
        print(f"Try importing '{OUTPUT_FILE}' into Roll20 instead.")
    else:
        print("Success! No missing 'type' fields found.")
    print("="*30)

if __name__ == "__main__":
    process_json()

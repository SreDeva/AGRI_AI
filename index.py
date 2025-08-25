import os, csv, re, json
from pathlib import Path
from tqdm import tqdm
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer, util

DATA_DIR = Path("Plant_Disease_Dataset")
META_CSV = Path("plant_disease_index_metadata.csv")
FAISS_FILE = Path("plant_disease_index.faiss")

# Heuristics and helpers to normalize varied folder naming patterns
CROP_ALIASES = {
    'pepper, bell': 'Bell pepper',
    'corn (maize)': 'Corn',
}

# Some disease-only folder names map to common crops (adjust if needed)
DISEASE_DEFAULT_CROP = {
    'brown spot': 'Rice',
    'leaf smut': 'Rice',
    'bacterial leaf blight': 'Rice',
}

def _norm(s: str) -> str:
    s = s.replace('-', ' ')
    s = re.sub(r'[_(),/]+', ' ', s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def _canon_crop(crop: str) -> str:
    key = crop.lower()
    return CROP_ALIASES.get(key, crop)


def parse_class(folder_name: str):
    """
    Robust parser for class folder names. Handles patterns such as:
    - "Crop___Condition"
    - "RESIZED_BANANA_*" / "BANANA_*" -> Banana crop
    - "Sugarcane_Leaf_*" -> Sugarcane with condition sans "Leaf"
    - "good_Cucumber" / "Ill_cucumber" -> healthy/diseased for crop
    - "Crop_Condition" (single underscore)
    - Disease-only folders like "Brown spot" -> mapped via DISEASE_DEFAULT_CROP
    """
    name = folder_name.strip().rstrip('_')
    nlow = name.lower()

    # 1) Standard: Crop___Condition
    if '___' in name:
        a, b = name.split('___', 1)
        crop = _canon_crop(_norm(a))
        condition = _norm(b)

    # 2) Banana special sets: RESIZED_BANANA_*, BANANA_*
    elif re.match(r'^(resized_)?banana[_-]', nlow):
        m = re.match(r'^(?:resized_)?banana[_-](.+)$', name, re.I)
        crop = 'Banana'
        condition = _norm(m.group(1)) if m else 'unknown'

    # 3) Sugarcane variants: Sugarcane_Leaf_Rust, Sugarcane_Leaf_Healthy, Sugarcane_Leaf_Yellow
    elif nlow.startswith('sugarcane'):
        crop = 'Sugarcane'
        rest = name[len('Sugarcane'):]
        condition = _norm(re.sub(r'^[_\s-]*leaf[_\s-]*', '', rest, flags=re.I)) or 'unknown'

    # 4) Good/Ill prefix: good_Cucumber, Ill_cucumber
    elif re.match(r'^(good|ill)[_\s-]+', nlow):
        m = re.match(r'^(good|ill)[_\s-]+(.+)$', name, re.I)
        crop = _canon_crop(_norm(m.group(2))) if m else 'Unknown'
        condition = 'healthy' if (m and m.group(1).lower() == 'good') else 'diseased'

    # 5) Single-underscore fallback: Crop_Condition
    elif '_' in name:
        first, rest = name.split('_', 1)
        crop = _canon_crop(_norm(first))
        condition = _norm(rest)

    # 6) Disease-only folders: e.g., "Brown spot", "Leaf smut"
    else:
        condition = _norm(name)
        crop = DISEASE_DEFAULT_CROP.get(condition.lower(), 'Unknown')

    crop = _canon_crop(crop)
    is_healthy = condition.lower() in {'healthy', 'leaf healthy', 'good'}
    return crop, condition, is_healthy, f"{crop} - {condition}"

def build_docs():
    rows = []
    for class_dir in sorted([p for p in DATA_DIR.iterdir() if p.is_dir()]):
        crop, condition, is_healthy, class_name = parse_class(class_dir.name)
        for img_path in class_dir.glob("*.*"):
            if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            text = (
                f"Crop: {crop}. Condition: {condition}. "
                f"This is a leaf image labeled '{class_name}'. "
                f"Healthy: {'yes' if is_healthy else 'no'}."
            )
            rows.append({
                "id": len(rows),
                "class_name": class_name,
                "crop": crop,
                "condition": condition,
                "is_healthy": is_healthy,
                "image_path": str(img_path),
                "text": text
            })
    return rows

def save_metadata(rows):
    with META_CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["id","class_name","crop","condition","is_healthy","image_path","text"])
        w.writeheader()
        for r in rows:
            w.writerow(r)

def build_faiss(rows, model_name="sentence-transformers/all-MiniLM-L6-v2", batch_size=256):
    model = SentenceTransformer(model_name)
    texts = [r["text"] for r in rows]
    embeddings = []
    for i in tqdm(range(0, len(texts), batch_size), desc="Embedding"):
        embs = model.encode(texts[i:i+batch_size], normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False)
        embeddings.append(embs)
    X = np.vstack(embeddings).astype("float32")

    index = faiss.IndexFlatIP(X.shape[1])  # cosine via normalized + inner product
    index.add(X)
    faiss.write_index(index, str(FAISS_FILE))

def test_search(query, top_k=5):
    index = faiss.read_index(str(FAISS_FILE))
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    q = model.encode([query], normalize_embeddings=True, convert_to_numpy=True).astype("float32")
    scores, idxs = index.search(q, top_k)
    with META_CSV.open("r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
    results = []
    for score, idx in zip(scores[0], idxs[0]):
        row = reader[idx]
        results.append({"score": float(score), "crop": row["crop"], "condition": row["condition"], "image_path": row["image_path"], "text": row["text"]})
    return results

if __name__ == "__main__":
    rows = build_docs()
    save_metadata(rows)
    build_faiss(rows)
    # quick sanity check
    demo = test_search("tomato leaf blight symptoms", top_k=5)
    print(json.dumps(demo, indent=2)[:1000])
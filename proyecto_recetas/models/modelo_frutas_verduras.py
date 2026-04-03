"""
Clasificación de una sola fruta/verdura con ResNet-50 (Hugging Face).
Pesos locales: model_fruitsandvegetables/model.safetensors + config.json
"""
import json
import os

import numpy as np
import torch
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(os.path.dirname(BASE_DIR), "model_fruitsandvegetables")

_model = None
_device = None
_id2label = None

_IMAGENET_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
_IMAGENET_STD = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)


def _pil_to_model_tensor(img: Image.Image) -> torch.Tensor:
    """RGB 224×224, normalización ImageNet (ResNet)."""
    try:
        resample = Image.Resampling.BILINEAR
    except AttributeError:
        resample = Image.BILINEAR
    img = img.resize((224, 224), resample)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    t = torch.from_numpy(arr).permute(2, 0, 1)
    t = (t - _IMAGENET_MEAN) / _IMAGENET_STD
    return t.unsqueeze(0)

# Etiquetas en inglés (id2label) → nombre en español para la lista de ingredientes
_EN_TO_ES = {
    "apple": "manzana",
    "banana": "plátano",
    "beetroot": "remolacha",
    "bell pepper": "pimiento",
    "cabbage": "repollo",
    "capsicum": "pimiento",
    "carrot": "zanahoria",
    "cauliflower": "coliflor",
    "chilli pepper": "chile",
    "corn": "maíz",
    "cucumber": "pepino",
    "eggplant": "berenjena",
    "garlic": "ajo",
    "ginger": "jengibre",
    "grapes": "uvas",
    "jalepeno": "jalapeño",
    "kiwi": "kiwi",
    "lemon": "limón",
    "lettuce": "lechuga",
    "mango": "mango",
    "onion": "cebolla",
    "orange": "naranja",
    "paprika": "pimentón",
    "pear": "pera",
    "peas": "guisantes",
    "pineapple": "piña",
    "pomegranate": "granada",
    "potato": "papa",
    "raddish": "rábano",
    "soy beans": "soja",
    "spinach": "espinaca",
    "sweetcorn": "maíz dulce",
    "sweetpotato": "batata",
    "tomato": "tomate",
    "turnip": "nabo",
    "watermelon": "sandía",
}


def _load_id2label():
    global _id2label
    if _id2label is not None:
        return _id2label
    cfg_path = os.path.join(MODEL_DIR, "config.json")
    with open(cfg_path, encoding="utf-8") as f:
        cfg = json.load(f)
    raw = cfg["id2label"]
    _id2label = {int(k): v for k, v in raw.items()}
    return _id2label


def _en_to_es(label_en: str) -> str:
    key = label_en.lower().strip()
    return _EN_TO_ES.get(key, label_en)


def _get_model():
    global _model, _device
    if _model is None:
        try:
            from transformers import AutoModelForImageClassification
        except ImportError as e:
            raise RuntimeError(
                "Falta el paquete transformers. Instala: pip install transformers safetensors"
            ) from e

        if not os.path.isfile(os.path.join(MODEL_DIR, "model.safetensors")):
            raise FileNotFoundError(
                f"No se encontró model.safetensors en {MODEL_DIR}"
            )

        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _model = AutoModelForImageClassification.from_pretrained(
            MODEL_DIR,
            local_files_only=True,
        )
        _model.to(_device)
        _model.eval()
    return _model, _device


def predecir_fruta_verdura(ruta_imagen: str, top_k: int = 5):
    """
    Devuelve la clase más probable y las top_k predicciones.
    """
    id2label = _load_id2label()
    img = Image.open(ruta_imagen).convert("RGB")
    batch = _pil_to_model_tensor(img)
    model, device = _get_model()
    batch = batch.to(device)

    with torch.no_grad():
        out = model(pixel_values=batch)
        logits = out.logits[0]
        probs = torch.softmax(logits, dim=-1)

    n = len(probs)
    k = min(max(1, top_k), n)
    scores, indices = torch.topk(probs, k)

    top_list = []
    for score, idx in zip(scores.tolist(), indices.tolist()):
        en = id2label[int(idx)]
        top_list.append(
            {
                "label_en": en,
                "label_es": _en_to_es(en),
                "score": round(float(score), 4),
            }
        )

    best = top_list[0]
    return {
        "label_en": best["label_en"],
        "label_es": best["label_es"],
        "confidence": best["score"],
        "top_predictions": top_list,
    }

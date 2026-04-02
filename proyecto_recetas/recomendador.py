from sentence_transformers import SentenceTransformer, util
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 🔥 modelo de embeddings (texto)
modelo_embeddings = SentenceTransformer("all-MiniLM-L6-v2")

# 🔥 USAR TU ARCHIVO REAL
RECETAS_PATH = os.path.join(BASE_DIR, "..", "data", "map_plato_ingredientes.json")

# cargar dataset
if os.path.exists(RECETAS_PATH):
    recetas_json = json.load(open(RECETAS_PATH, "r", encoding="utf-8"))

    # 🔥 convertir a formato estándar
    recetas = []
    for nombre, ingredientes in recetas_json.items():
        recetas.append({
            "nombre": nombre,
            "ingredientes": ingredientes
        })
else:
    recetas = []

# 🔥 generar embeddings una sola vez
receta_textos = [r["ingredientes"] for r in recetas]

if len(receta_textos) > 0:
    receta_embeddings = modelo_embeddings.encode(receta_textos, convert_to_tensor=True)
else:
    receta_embeddings = []

# 🔥 función recomendador
def recomendar_por_texto(texto_usuario, top_k=5):
    if len(recetas) == 0:
        return []

    consulta_emb = modelo_embeddings.encode(texto_usuario, convert_to_tensor=True)
    similitudes = util.cos_sim(consulta_emb, receta_embeddings)[0]

    top_indices = similitudes.argsort(descending=True)[:top_k]

    resultados = []
    for idx in top_indices:
        receta = recetas[int(idx)]
        score = float(similitudes[idx])

        resultados.append({
            "nombre": receta["nombre"],
            "ingredientes": receta["ingredientes"],
            "score": round(score, 3)
        })

    return resultados